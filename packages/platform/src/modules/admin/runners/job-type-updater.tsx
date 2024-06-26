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

import { Dropdown, IDropdownOption, IDropdownProps } from '@fluentui/react'
import { useDispatchers } from '@sigi/react'
import { memo, useCallback } from 'react'

import { JobType } from '@johfe/perfsee-schema'

import { Runner, RunnersModule } from './module'

type JobTypeUpdaterProps = Omit<IDropdownProps, 'options'> & {
  runner: Runner
}

const options: IDropdownOption[] = Object.values(JobType).map((type) => ({
  key: type,
  text: type,
}))

export const JobTypeUpdater = memo(({ runner, ...props }: JobTypeUpdaterProps) => {
  const dispatcher = useDispatchers(RunnersModule)

  const onJobTypeChange = useCallback(
    (_: any, option: IDropdownOption | undefined) => {
      if (option?.key) {
        dispatcher.updateRunner({ id: runner.id, jobType: option.key as JobType })
      }
    },
    [runner, dispatcher],
  )

  return (
    <Dropdown
      {...props}
      selectedKey={runner.jobType}
      options={options}
      onChange={onJobTypeChange}
      styles={{ dropdown: { minWidth: 150 } }}
    />
  )
})
