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

import { Module, EffectModule, Effect, Reducer, DefineAction, ImmerReducer } from '@sigi/core'
import { Draft } from 'immer'
import { interval, Observable, of } from 'rxjs'
import { switchMap, startWith, takeUntil, mergeMap, withLatestFrom, catchError, map } from 'rxjs/operators'

import { GraphQLClient, notify } from '@fe/perfsee-platform/common'
import { JobType, jobTraceQuery, JobTraceQuery, jobsQuery, JobsQuery } from '@fe/perfsee-schema'
import { JobLog, JobLogLevel } from '@fe/perfsee-shared'

type JobTraceResponse = Omit<JobTraceQuery['project']['job']['trace'], 'logs'> & { logs: JobLog[] }

export type Log = {
  id: number
  level: JobLogLevel
  time: number
  elapsed: number
  message: string
  payload: any
  children?: Log[]
}

interface State {
  logs: Log[] | undefined
  endCursor: number
  hasMore: boolean
  jobs: JobsQuery['project']['jobs']
}

@Module('JobTraceModule')
export class JobTraceModule extends EffectModule<State> {
  readonly defaultState: State = {
    logs: undefined,
    endCursor: -1,
    hasMore: true,
    jobs: [],
  }

  @DefineAction()
  dispose$!: Observable<void>

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  getJobTrace(payload$: Observable<{ projectId: string; type: JobType; jobId: number }>) {
    return payload$.pipe(
      switchMap(({ projectId, type, jobId }) =>
        interval(3000).pipe(
          startWith(0),
          withLatestFrom(this.state$),
          switchMap(([, { endCursor }]) =>
            this.client
              .query({
                query: jobTraceQuery,
                variables: {
                  projectId,
                  jobType: type,
                  jobId,
                  after: endCursor,
                },
              })
              .pipe(
                mergeMap((data) => {
                  const trace = data.project.job.trace
                  if (trace.hasMore) {
                    return [this.getActions().setTrace(trace)]
                  } else {
                    return [this.getActions().setTrace(trace), this.getActions().dispose$()]
                  }
                }),
                catchError(() => {
                  notify.error({ content: "Job trace doesn't exist or has expired." })
                  return of(this.getActions().dispose$())
                }),
              ),
          ),
          takeUntil(this.dispose$),
        ),
      ),
    )
  }

  @Effect()
  getJobs(payload$: Observable<{ projectId: string; type: JobType; entityId: string }>) {
    return payload$.pipe(
      switchMap(({ projectId, type, entityId }) =>
        this.client
          .query({
            query: jobsQuery,
            variables: {
              projectId,
              jobType: type,
              entityId: parseInt(entityId),
            },
          })
          .pipe(
            map((results) => this.getActions().setJobs(results.project.jobs)),
            catchError(() => {
              notify.error({ content: 'Can not get jobs' })
              return of(this.getActions().dispose$())
            }),
          ),
      ),
    )
  }

  @ImmerReducer()
  setJobs(state: Draft<State>, jobs: JobsQuery['project']['jobs']) {
    state.jobs = jobs
  }

  @ImmerReducer()
  resetTrace(state: Draft<State>) {
    state.logs = undefined
    state.endCursor = -1
    state.hasMore = true
  }

  @Reducer()
  setTrace(state: State, { hasMore, logs: rawLogs, endCursor }: JobTraceResponse): State {
    const logs = [...(state.logs ?? [])]
    const percedingCount = logs.length
    let elapsed = logs.length ? logs[logs.length - 1].time : 0

    rawLogs.forEach((log, i) => {
      const [level, time, message, payload] = log
      const curLog = {
        id: i + percedingCount,
        level,
        elapsed: time - (elapsed || time),
        time,
        message: typeof message === 'string' ? message : JSON.stringify(message),
        payload,
      }
      elapsed = time

      if (level !== JobLogLevel.info && level !== JobLogLevel.error) {
        const lastLog = logs.length ? logs[logs.length - 1] : undefined
        if (lastLog && lastLog.level === JobLogLevel.info) {
          if (!lastLog.children) {
            lastLog.children = [curLog]
          } else {
            lastLog.children.push(curLog)
          }
        }
      } else {
        logs.push(curLog)
      }
    })

    return {
      endCursor,
      logs,
      hasMore,
      jobs: state.jobs,
    }
  }
}
