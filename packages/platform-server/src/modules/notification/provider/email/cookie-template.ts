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

import templates from '@johfe/perfsee-email-templates'
import { pathFactory, staticPath } from '@johfe/perfsee-shared/routes'

import { SendMailOptions } from '../../../email'
import { CookieNotificationInfo } from '../../type'

import { compileEmailTemplate } from './utils'

const template = compileEmailTemplate(templates.message)

export function cookieEmailTemplate(
  { environments, project }: CookieNotificationInfo,
  host: string,
): Omit<SendMailOptions, 'to'> {
  let content = ''
  environments.forEach((env) => {
    content += `Environment #${env.name}\n`
  })

  content +=
    host +
    pathFactory.project.settings({
      projectId: project.slug,
      settingName: 'environments',
    })

  const title = `[${project.namespace}/${project.name}] These cookies will expire soon`

  return {
    subject: title,
    text: content,
    html: template({
      env: {
        host: host + staticPath.home,
      },
      title,
      message: content.replace('\n', '<br>'),
    }),
  }
}
