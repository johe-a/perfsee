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

import { Option } from 'clipanion'
import inquirer, { Question } from 'inquirer'
import { first } from 'lodash'
import webpack from 'webpack'

import { getPackage, PackageName, packagePath, pathToRoot } from '../utils'
import { getFrontendConfig } from '../webpack/frontend-config'
import { getNodeConfig } from '../webpack/node-config'
import { runWebpack } from '../webpack/webpack.config'

import { Command } from './command'

const packages: PackageName[] = ['@fe/perfsee-platform', '@fe/perfsee-platform-server', '@fe/perfsee-job-runner']

const projectQuestion: Question = {
  type: 'list',
  name: 'Choose a project to bundle',
  choices: packages,
  prefix: '🛠',
}

const webpackConfigs: { [index: string]: webpack.Configuration } = {
  '@fe/perfsee-platform': {
    ...getFrontendConfig(),
    output: {
      path: pathToRoot('assets', 'platform'),
    },
  },
  '@fe/perfsee-platform-server': {
    ...getNodeConfig(),
    entry: {
      main: packagePath('@fe/perfsee-platform-server', 'src', 'index.ts'),
      cli: packagePath('@fe/perfsee-platform-server', 'src', 'cli.app.ts'),
    },
  },
  '@fe/perfsee-job-runner': getNodeConfig(),
  '@fe/perfsee-bundle-report': {
    entry: {
      main: packagePath('@fe/perfsee-bundle-report', 'src', 'static.tsx'),
    },
    devtool: 'inline-cheap-module-source-map',
    output: {
      path: packagePath('@fe/perfsee-plugin-utils', 'public'),
      filename: 'report.js',
      asyncChunks: false,
    },
    optimization: {
      splitChunks: false,
      runtimeChunk: false,
    },
    module: {
      rules: [
        {
          test: /\.png$/,
          type: 'asset/inline',
        },
      ],
    },
  },
  '@fe/perfsee-package-report': {
    entry: {
      main: packagePath('@fe/perfsee-package-report', 'src', 'report.tsx'),
    },
    devtool: 'inline-cheap-module-source-map',
    output: {
      path: packagePath('@fe/perfsee-package', 'public'),
      filename: 'report.js',
      asyncChunks: false,
    },
    optimization: {
      splitChunks: false,
      runtimeChunk: false,
    },
  },
  '@fe/perfsee-bundle-analyzer': {
    entry: {
      main: packagePath('@fe/perfsee-bundle-analyzer', 'src', 'stats-parser', 'audit', '__extensions__', 'index.ts'),
    },
    devtool: false,
    output: {
      path: packagePath('@fe/perfsee-bundle-analyzer', 'tmp', 'audit'),
      filename: 'index.js',
      asyncChunks: false,
      iife: false,
    },
    optimization: {
      splitChunks: false,
      runtimeChunk: false,
    },
  },
}

/**
 * Bundle project using webpack
 */
export class BundleCommand extends Command {
  static paths = [[`bundle`]]
  static async webpack(project: PackageName) {
    const pkg = getPackage(project)
    return runWebpack({ entry: pkg.entryPath, project: pkg.dirname }, 'production', webpackConfigs[project])
  }

  verbose = Option.Boolean(`-v,--verbose`, false)

  project: PackageName = Option.String(`-p,--project`)!

  async execute() {
    await this.webpackBuild()
  }

  private async webpackBuild() {
    let project: PackageName
    if (this.project) {
      project = this.project
    } else {
      const q = projectQuestion
      // @ts-expect-error
      if (q.choices.length === 1) {
        // @ts-expect-error
        project = first(q.choices)!
      } else {
        const answer = await inquirer.prompt([q])
        project = answer[q.name!]
      }
    }

    return BundleCommand.webpack(project)
  }
}
