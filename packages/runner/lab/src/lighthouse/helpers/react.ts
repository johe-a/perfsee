/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { parse } from 'acorn'
import { recursive } from 'acorn-walk'
import { Node, FunctionExpression, ArrowFunctionExpression, VariableDeclaration } from 'estree'
import fetch from 'node-fetch'
import type {
  ElementType,
  ProfilingDataBackend,
  ProfilingDataForRootFrontend,
  TimelineData,
} from 'react-devtools-inline'

import { ReactDevtoolProfilingDataFrontend } from '@johfe/perfsee-flamechart'
import { ReactDevtoolProfilingDataExport } from '@johfe/perfsee-shared'

interface State {
  replaceRange?: [number, number]
  version?: string
  exportsIdentifier?: string
  params?: string[]
  deps?: string[]

  // react-dom verison < 16.13
  isLegacy?: boolean
}
const visit = recursive as unknown as <TState>(
  ast: Node,
  state: TState,
  visitor: {
    [K in Node['type']]?: (
      node: Extract<Node, { type: K }>,
      state: TState,
      callback: (node: Node, state: TState) => void,
    ) => void
  },
) => void

const REACT_DOM_WITH_LICENSE_COMMENTS_REGEXP =
  /\/\*\*.*?@license React.*?\s.*?react-dom\.production\.min\.js[\s|\S]*?\*\/\s*([\s\S]*rendererPackageName:"react-dom"[\s\S]*\w+\.version="(?<version>.*?)"[\s\S]*?)((\/\*\*.*?@license)|\s$)/

const wrapCjsScript = async (
  text: string,
  state: State,
  schedulerTracingWrapper: string,
  developmentBuild?: boolean,
) => {
  const params = state.params!
  const profilingBuildGetModuleCallRegexp =
    /((?:var (?<a>\w+))|(?:,\s?(?<b>\w+)))\s?=\s?require\((\d+|(?:["'].*?["']))\)/g

  // if above react 18, deps are `react` and `scheduler`
  // if under 18, deps are `react`, `object-assign` and `scheduler`
  const depsLength = Number(state.version?.split('.')[0]) >= 18 ? 2 : 3

  let index = 0
  const variableIds: string[] = []
  const requires: string[] = []
  const moduleIdReplacedText: string = text
    .replaceAll(profilingBuildGetModuleCallRegexp, (_match, ...args) => {
      const group = args[args.length - 1]
      variableIds[index] = group.a || group.b

      // get deps from end
      const dep = state.deps?.[state.deps.length - depsLength + index]
      if (dep) {
        requires.push(`var required${index}=${dep};`)
      } else {
        requires.push(`var required${index}=${schedulerTracingWrapper};`)
      }
      index++
      return ''
    })
    .replace('"use strict"', '')
    .replace('process.env.NODE_ENV', '"development"')
    .replace('usingClientEntryPoint: false', 'usingClientEntryPoint: true')
  requires.push(variableIds.map((id, i) => `var ${id}=required${i}`).join(';'))

  const overrideReact = developmentBuild ? `Object.assign(React, ${await getWrapCjsReactDev(state.version)});` : ''

  return `function(${params.join(',')}){"use strict";var ${
    state.isLegacy ? 'module' : 'exports'
  }=${state.exportsIdentifier!};${requires.join('')};${overrideReact}${moduleIdReplacedText}}`
}

const getWrapCjsReactDev = async (version?: string) => {
  const reactText = await fetchReact(version, 'cjs', 'development')
  return `(function(exports){
      ${reactText.replace('process.env.NODE_ENV', '"development"')};
      return exports
    })({})`
}

const SCRIPT_CDN = 'https://unpkg.com'

let schedulerTracingScript: string
const fetchSchedulerTracing = async () => {
  if (schedulerTracingScript) {
    return schedulerTracingScript
  }

  const resp = await fetch(`${SCRIPT_CDN}/scheduler@0.20.2/cjs/scheduler-tracing.profiling.min.js`)
  schedulerTracingScript = await resp.text()
  return schedulerTracingScript
}

export const fetchReactDom = async (version?: string, moduleType = 'cjs', build = 'profiling.min'): Promise<string> => {
  const resp = await fetch(`${SCRIPT_CDN}/react-dom${version ? `@${version}` : ''}/${moduleType}/react-dom.${build}.js`)

  // not found
  if (!resp.headers.get('Content-Type')?.includes('application/javascript')) {
    if (version?.includes('-')) {
      return fetchReactDom(version.split('-')[0], moduleType, build)
    } else {
      throw new Error(`\`react-dom\` of version ${version} not found.`)
    }
  }

  return resp.text()
}

export const fetchReact = async (version?: string, moduleType = 'cjs', build = 'profiling.min'): Promise<string> => {
  const resp = await fetch(`${SCRIPT_CDN}/react${version ? `@${version}` : ''}/${moduleType}/react.${build}.js`)

  // not found
  if (!resp.headers.get('Content-Type')?.includes('application/javascript')) {
    if (version?.includes('-')) {
      return fetchReact(version.split('-')[0], moduleType, build)
    } else {
      throw new Error(`\`react\` of version ${version} not found.`)
    }
  }

  return resp.text()
}

export async function generateProfilingBundle(origin: string, build?: 'profiling.min' | 'development') {
  const matchComments = REACT_DOM_WITH_LICENSE_COMMENTS_REGEXP.exec(origin)
  const state: State = {}

  const visitFunction = (
    node: FunctionExpression | ArrowFunctionExpression,
    state: State,
    callback: (node: Node, state: State) => void,
  ) => {
    if (state.replaceRange) {
      return
    }

    if (node.body.type !== 'BlockStatement') {
      return callback(node.body, state)
    }

    const bodyText = origin.substring(...node.body.range!)
    const reactDomRegex = /rendererPackageName:\s?"react-dom"[\s\S]*?(?<exports>\w+)\.version="(?<version>[\s\S]*?)"/
    const legacyReactDomRegex =
      /version:\s?"(?<version>(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)",\s?rendererPackageName:\s?"react-dom"[\s\S]*?(?<exports>\w+)\.exports=/
    let match = reactDomRegex.exec(bodyText)

    if (!match) {
      const legacyMatch = legacyReactDomRegex.exec(bodyText)
      if (legacyMatch) {
        state.isLegacy = true
        match = legacyMatch
      }
    }

    if (match) {
      state.params = node.params.map((param) => origin.substring(...param.range!))
      const body = node.body.body
      const dependencies = body.find((stmt, i) => {
        return (
          stmt.type === 'VariableDeclaration' &&
          body[i + 1] &&
          body[i + 1].type === 'FunctionDeclaration' &&
          origin.substring(...body[i + 1].range!).includes('error-decoder.html')
        )
      }) as VariableDeclaration | undefined

      if (!dependencies) {
        return callback(node.body, state)
      }

      state.deps ||= []
      for (const depDecl of dependencies.declarations.filter((decl) => decl.init)) {
        const text = origin.substring(...depDecl.init!.range!)
        state.deps.push(text)
      }

      state.version = match.groups?.version
      state.replaceRange = node.range
      state.exportsIdentifier = match.groups!.exports
      return
    }

    callback(node.body, state)
  }

  if (matchComments) {
    // react dom has leading License comments

    const [matched, text, version] = matchComments
    // only support react-dom >= 16.6
    const [major, minor] = version.split('.')
    if (!(parseInt(major, 10) > 16 || (parseInt(major, 10) === 16 && parseInt(minor, 10) >= 6))) {
      return
    }

    const start = matchComments.index
    const end = matchComments.index + matched.length
    if (text.startsWith('(function()')) {
      // it's umd
      const reactDomProflingBuild = await fetchReactDom(version, 'umd', build)
      const reactProfilingBuild = await fetchReact(version, 'umd', build)
      return origin.slice(0, start) + reactProfilingBuild + reactDomProflingBuild + origin.slice(end)
    }
  }

  const ast = parse(origin, { ecmaVersion: 'latest' as any, sourceType: 'script', ranges: true }) as Node

  visit(ast, state, {
    FunctionExpression: visitFunction,
    ArrowFunctionExpression: visitFunction,
  })

  if (matchComments && !state.replaceRange) {
    // react dom is not wrapped in a function
    // but has leading License comments

    const [matched] = matchComments
    const start = matchComments.index
    const end = matchComments.index + matched.length
    const ast = parse(`(function(){${matched}})`, {
      ecmaVersion: 'latest' as any,
      sourceType: 'script',
      ranges: true,
    }) as Node

    visit(ast, state, {
      FunctionExpression: visitFunction,
    })

    state.replaceRange = [start, end]
  }

  if (!state.replaceRange || !state.version) {
    return
  }

  // react dom is wrapped in a function
  // only support react-dom >= 16.6
  const [major, minor] = state.version.split('.')
  if (!(parseInt(major, 10) > 16 || (parseInt(major, 10) === 16 && parseInt(minor, 10) >= 6))) {
    return
  }

  const reactDomProfilingBuild = await fetchReactDom(state.version, 'cjs', build)
  const schedulerTracingWrapper = `(function(exports){${await fetchSchedulerTracing()}return exports;})({})`

  const [start, end] = state.replaceRange

  const resultText = await wrapCjsScript(
    reactDomProfilingBuild,
    state,
    schedulerTracingWrapper,
    build === 'development',
  )

  return `${origin.slice(0, start)}${resultText}${origin.slice(end)}`
}

export function detectReactDom(text: string) {
  return /rendererPackageName:\s?"react-dom"/.test(text)
}

export function detectVersion(text: string) {
  return /\w+\.version="(?<version>.*?)"/.exec(text)?.groups?.version
}

export function isProfilingBuild(text: string) {
  return /injectProfilingHooks:/.test(text)
}

/**
 * from react-devtools-shared
 */
export function prepareProfilingDataFrontendFromBackendAndStore(
  dataBackends: Array<ProfilingDataBackend>,
  operationsByRootID: Map<number, Array<Array<number>>>,
): ReactDevtoolProfilingDataFrontend {
  const dataForRoots: Map<number, ProfilingDataForRootFrontend> = new Map()

  const timelineDataArray: TimelineData[] = []

  dataBackends.forEach((dataBackend) => {
    const { timelineData } = dataBackend
    if (timelineData != null) {
      const {
        batchUIDToMeasuresKeyValueArray,
        internalModuleSourceToRanges,
        laneToLabelKeyValueArray,
        laneToReactMeasureKeyValueArray,
        ...rest
      } = timelineData

      timelineDataArray.push({
        ...rest,

        // Most of the data is safe to parse as-is,
        // but we need to convert the nested Arrays back to Maps.
        batchUIDToMeasuresMap: new Map(batchUIDToMeasuresKeyValueArray),
        internalModuleSourceToRanges: new Map(internalModuleSourceToRanges),
        laneToLabelMap: new Map(laneToLabelKeyValueArray),
        laneToReactMeasureMap: new Map(laneToReactMeasureKeyValueArray),
      })
    }

    dataBackend.dataForRoots.forEach(({ commitData, displayName, initialTreeBaseDurations, rootID }) => {
      const operations = operationsByRootID.get(rootID)
      if (operations == null) {
        throw Error(`Could not find profiling operations for root "${rootID}"`)
      }

      // Do not filter empty commits from the profiler data!
      // Hiding "empty" commits might cause confusion too.
      // A commit *did happen* even if none of the components the Profiler is showing were involved.
      const convertedCommitData = commitData.map((commitDataBackend, _commitIndex) => ({
        changeDescriptions:
          commitDataBackend.changeDescriptions != null ? new Map(commitDataBackend.changeDescriptions) : null,
        duration: commitDataBackend.duration,
        effectDuration: commitDataBackend.effectDuration,
        fiberActualDurations: new Map(commitDataBackend.fiberActualDurations),
        fiberSelfDurations: new Map(commitDataBackend.fiberSelfDurations),
        passiveEffectDuration: commitDataBackend.passiveEffectDuration,
        priorityLevel: commitDataBackend.priorityLevel,
        timestamp: commitDataBackend.timestamp,
        updaters:
          commitDataBackend.updaters !== null
            ? commitDataBackend.updaters.map((serializedElement) => {
                const [serializedElementDisplayName, serializedElementHocDisplayNames] = separateDisplayNameAndHOCs(
                  serializedElement.displayName,
                  serializedElement.type,
                )
                return {
                  ...serializedElement,
                  displayName: serializedElementDisplayName,
                  hocDisplayNames: serializedElementHocDisplayNames,
                }
              })
            : null,
      }))

      dataForRoots.set(rootID, {
        commitData: convertedCommitData,
        displayName,
        initialTreeBaseDurations: new Map(initialTreeBaseDurations),
        operations,
        rootID,
        snapshots: new Map(),
      })
    })
  })

  return { dataForRoots, imported: false, timelineData: timelineDataArray }
}

// Converts a Store Profiling data into a format that can be safely (JSON) serialized for export.
export function prepareReactDevtoolProfilingDataExport(
  profilingDataFrontend: ReactDevtoolProfilingDataFrontend,
): ReactDevtoolProfilingDataExport {
  const timelineData = profilingDataFrontend.timelineData.map(
    ({
      batchUIDToMeasuresMap,
      componentMeasures,
      duration,
      flamechart,
      internalModuleSourceToRanges,
      laneToLabelMap,
      laneToReactMeasureMap,
      nativeEvents,
      networkMeasures,
      otherUserTimingMarks,
      reactVersion,
      schedulingEvents,
      snapshots,
      snapshotHeight,
      startTime,
      suspenseEvents,
      thrownErrors,
    }) => ({
      // Most of the data is safe to serialize as-is,
      // but we need to convert the Maps to nested Arrays.
      batchUIDToMeasuresKeyValueArray: Array.from(batchUIDToMeasuresMap.entries()),
      componentMeasures: componentMeasures,
      duration,
      flamechart,
      internalModuleSourceToRanges: Array.from(internalModuleSourceToRanges.entries()),
      laneToLabelKeyValueArray: Array.from(laneToLabelMap.entries()),
      laneToReactMeasureKeyValueArray: Array.from(laneToReactMeasureMap.entries()),
      nativeEvents,
      networkMeasures,
      otherUserTimingMarks,
      reactVersion,
      schedulingEvents,
      snapshots,
      snapshotHeight,
      startTime,
      suspenseEvents,
      thrownErrors,
    }),
  )

  const dataForRoots: any[] = []
  profilingDataFrontend.dataForRoots.forEach(
    ({ commitData, displayName, initialTreeBaseDurations, operations, rootID, snapshots }) => {
      dataForRoots.push({
        commitData: commitData.map(
          ({
            changeDescriptions,
            duration,
            effectDuration,
            fiberActualDurations,
            fiberSelfDurations,
            passiveEffectDuration,
            priorityLevel,
            timestamp,
            updaters,
          }) => ({
            changeDescriptions: changeDescriptions != null ? Array.from(changeDescriptions.entries()) : null,
            duration,
            effectDuration,
            fiberActualDurations: Array.from(fiberActualDurations.entries()),
            fiberSelfDurations: Array.from(fiberSelfDurations.entries()),
            passiveEffectDuration,
            priorityLevel,
            timestamp,
            updaters,
          }),
        ),
        displayName,
        initialTreeBaseDurations: Array.from(initialTreeBaseDurations.entries()),
        operations,
        rootID,
        snapshots: Array.from(snapshots.entries()),
      })
    },
  )

  return {
    version: 5 /* PROFILER_EXPORT_VERSION */,
    dataForRoots,
    timelineData,
  }
}

function separateDisplayNameAndHOCs(
  displayName: string | null,
  type: ElementType,
): [string | null, Array<string> | null] {
  if (displayName === null) {
    return [null, null]
  }

  let hocDisplayNames = null

  switch (type) {
    case 1:
    case 6:
    case 5:
    case 8:
      if (displayName.indexOf('(') >= 0) {
        const matches = displayName.match(/[^()]+/g)
        if (matches != null) {
          displayName = matches.pop() || null
          hocDisplayNames = matches
        }
      }
      break
    default:
      break
  }

  return [displayName, hocDisplayNames]
}
