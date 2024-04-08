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

import { Stack, IStackTokens } from '@fluentui/react'
import { useDispatchers, useModule } from '@sigi/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ContentCard, Select } from '@johfe/perfsee-components'
import { SnapshotStatus } from '@johfe/perfsee-schema'

import { VersionPerformanceOverview } from '../../components'
import { VersionSnapshotReport } from '../../version-report/types'
import { HashReportModule } from '../../version-report/version-report.module'

import { StatisticsModule } from './module'
import { TrendsChart } from './trends-chart'

const stackTokens: IStackTokens = {
  childrenGap: 20,
}

export const Statistics = () => {
  const { reset } = useDispatchers(StatisticsModule)
  const [{ allCommits, lab, artifactJob, lhContent, currentIssueCount }, dispatcher] = useModule(HashReportModule)

  const [selectedReport, setReport] = useState<VersionSnapshotReport | undefined>()

  const reports = useMemo(() => {
    return lab.reports?.filter((r) => r.status === SnapshotStatus.Completed) ?? []
  }, [lab.reports])

  const versionOptions = useMemo(() => {
    return reports.map((r) => {
      return {
        key: r.id,
        text: `#${r.id} ${r.page.name} * ${r.profile.name} * ${r.environment.name}`,
      }
    })
  }, [reports])

  const onReportChange = useCallback(
    (key: number) => {
      const report = reports.find((r) => r.id === key)
      setReport(report)
    },
    [reports],
  )

  useEffect(() => {
    dispatcher.getRecentCommits()
    return () => {
      reset()
      dispatcher.reset()
    }
  }, [dispatcher, reset])

  useEffect(() => {
    if (allCommits.commits.length) {
      const latestCommit = allCommits.commits[0]

      dispatcher.getArtifactByCommit(latestCommit)
      dispatcher.getSnapshotByCommit({ hash: latestCommit })
      dispatcher.fetchSourceIssueCount({ hash: latestCommit })
    }
  }, [allCommits.commits, dispatcher])

  useEffect(() => {
    if (!selectedReport && reports.length) {
      setReport(reports[0])
    }
  }, [reports, selectedReport])

  useEffect(() => {
    if (selectedReport?.reportLink) {
      dispatcher.fetchReportDetail(selectedReport.reportLink)
    }
  }, [dispatcher, selectedReport])

  return (
    <Stack tokens={stackTokens}>
      <ContentCard
        // eslint-disable-next-line react/jsx-no-bind
        onRenderHeader={() => (
          <>
            <span>Latest Version Report</span>
            <Stack horizontal tokens={{ childrenGap: '8px' }} verticalAlign="center">
              {!!versionOptions.length && (
                <Select<number>
                  title="Report"
                  selectedKey={selectedReport?.id}
                  options={versionOptions}
                  onKeyChange={onReportChange}
                />
              )}
              {/* <MoreVersionSpan>View More Versions</MoreVersionSpan> */}
            </Stack>
          </>
        )}
      >
        <VersionPerformanceOverview
          hash={allCommits.commits[0]}
          snapshotReport={selectedReport}
          artifact={artifactJob.artifact}
          lhContent={lhContent}
          loading={allCommits.loading || lab.loading}
          sourceIssueCount={currentIssueCount}
        />
      </ContentCard>
      <TrendsChart />
    </Stack>
  )
}
