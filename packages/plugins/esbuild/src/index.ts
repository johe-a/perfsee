import { Plugin, PluginBuild } from 'esbuild'

import {
  CommonPluginOptions as Options,
  initOptions,
  BuildUploadClient,
  generateReports,
} from '@johefe/perfsee-plugin-utils'

import { esbuildResult2Stats } from './adaptor'
import { getOutputPath } from './util'

export { BuildResult, BuildOptions, Metafile } from 'esbuild'

let version = 'unknown'

try {
  version = require('../package.json').version
} catch (e) {
  console.error('Read self version failed', e)
}

export { esbuildResult2Stats }

export const PerfseePlugin = (options: Options = {}): Plugin => {
  options = initOptions({
    ...options,
    toolkit: 'esbuild',
  })

  let outputPath: string

  return {
    name: 'perfsee-esbuild-plugin',
    setup(build: PluginBuild) {
      build.initialOptions.metafile = true

      outputPath = getOutputPath(build.initialOptions)

      build.onEnd(async ({ outputFiles, ...result }) => {
        const stats = esbuildResult2Stats(result, build.initialOptions)

        const client = new BuildUploadClient(options, outputPath, version)
        await client.uploadBuild(stats)
        await generateReports(stats, outputPath, options)
      })
    },
  }
}
