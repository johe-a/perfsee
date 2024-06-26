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

import { promises as fs } from 'fs'

import { Command } from 'clipanion'
// @ts-expect-error
import extract from 'extract-comments'
import { fdir } from 'fdir'

import { distPath, packagePath } from '../utils'

export class GenerateLicenseCommand extends Command {
  static paths = [['generate-license-file']]

  async execute() {
    const api = new fdir().withFullPaths().crawl(distPath)
    const files = (await api.withPromise()) as string[]
    const licenses = files.filter((idl) => idl.endsWith('.LICENSE.txt'))
    const licensesContent = await Promise.all(licenses.map((p) => fs.readFile(p, 'utf8')))
    const licenseContent = extract(licensesContent.join('\n'))
      .map(({ value }: any) => value)
      .join('\n')
      .split('\n')
      // a little bug from extract function
      .filter((line: string) => line.trim() !== '!')
      .map((line: string) => line.replace(/!/g, '').trim())
      .join('\n')
    await fs.writeFile(packagePath('@johfe/perfsee-platform', 'src/modules/license/license.txt'), licenseContent)
  }
}
