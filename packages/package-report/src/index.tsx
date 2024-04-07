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

import { Stack } from '@fluentui/react'
import { FC, memo, useCallback, useContext } from 'react'

import { ContentCard } from '@fe/perfsee-components'

import { PackageResultContext } from './context'
import { ReportContentWithRoute } from './pivot-content'
import BarGraph, { Reading } from './pivot-content-overview/bar-graph/bar-graph'
import { DetailHeaderDescription, DetailKey, InfoText, InfoTitle } from './styles'
import { PackageBundleResult } from './types'

export { BarGraph, Reading }
export { PackageResultContext }

export const PackageDetail = memo<{
  packageId: string
  packageBundleId: string
  projectId: string
}>((props) => {
  const { current } = useContext(PackageResultContext)

  const onRenderHeader = useCallback(() => {
    if (!current?.report) {
      return null
    }

    return <PackageDetailHeader packageBundleResult={current} />
  }, [current])

  return (
    <ContentCard onRenderHeader={onRenderHeader}>
      <ReportContentWithRoute {...props} />
    </ContentCard>
  )
})

interface DetailHeaderProps {
  packageBundleResult: PackageBundleResult
}

const PackageDetailHeader: FC<DetailHeaderProps> = memo(({ packageBundleResult }) => {
  const { packageJson } = packageBundleResult.report!
  return (
    <Stack>
      <Stack
        styles={{ root: { marginBottom: '12px' } }}
        horizontal
        verticalAlign="center"
        horizontalAlign="space-between"
      >
        <div>
          <DetailKey>{packageJson.name}</DetailKey>
          <DetailHeaderDescription>{packageJson.description}</DetailHeaderDescription>
        </div>
      </Stack>
      <Stack tokens={{ padding: '0 0 0 6px' }}>
        <div>
          <InfoTitle>Version: </InfoTitle>
          <InfoText>{packageBundleResult.version}</InfoText>
        </div>
        <div>
          <InfoTitle>Created at: </InfoTitle>
          <InfoText>{new Date(packageBundleResult.createdAt).toLocaleString()}</InfoText>
        </div>
      </Stack>
    </Stack>
  )
})
