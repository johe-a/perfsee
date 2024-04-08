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

import { AssetContent } from '@johfe/perfsee-lab-report/pivot-content-asset'
import { AnalysisReportContent } from '@johfe/perfsee-lab-report/pivot-content-performance'
import { PerformanceTabType, SnapshotDetailType } from '@johfe/perfsee-lab-report/snapshot-type'
import { lazy } from '@johfe/perfsee-platform/common'
import { Trace } from '@johfe/perfsee-platform/modules/job-trace'

import { MultiContentOverview, MultiContentBreakdown } from './multi-report'
import { OverviewPivotContent } from './pivot-content-overview'
import { SourceStatisticsContent } from './pivot-content-source'
import { UserFlowPivotContent } from './pivot-content-userflow'

export const FlameChartPivotContent = lazy(
  // @ts-expect-error
  () => import(/* webpackChunkName: "pivot-content-flamechart" */ '@johfe/perfsee-lab-report/pivot-content-flamechart'),
)

export const SourceCoveragePivotContent = lazy(
  () =>
    // @ts-expect-error
    import(
      /* webpackChunkName: "pivot-content-source-coverage" */ '@johfe/perfsee-lab-report/pivot-content-source-coverage'
    ),
)

export const ReactPivotContent = lazy(
  // @ts-expect-error
  () => import(/* webpackChunkName: "pivot-content-react" */ '@johfe/perfsee-lab-report/pivot-content-react'),
)

type PivotContentProps = {
  snapshot: SnapshotDetailType
  type: PerformanceTabType
}

export const PivotContent = (props: PivotContentProps) => {
  const { type, snapshot } = props

  switch (type) {
    case PerformanceTabType.Overview:
      return <OverviewPivotContent snapshot={snapshot} />
    case PerformanceTabType.UserFlow:
      return <UserFlowPivotContent snapshot={snapshot} />
    case PerformanceTabType.Asset:
      return <AssetContent snapshot={snapshot} />
    case PerformanceTabType.Flamechart:
      return <FlameChartPivotContent snapshot={snapshot} />
    case PerformanceTabType.SourceCoverage:
      return <SourceCoveragePivotContent snapshot={snapshot} />
    case PerformanceTabType.Report:
      return <AnalysisReportContent snapshot={snapshot} />
    case PerformanceTabType.React:
      return <ReactPivotContent snapshot={snapshot} />
    case PerformanceTabType.SourceStatistics:
      return <SourceStatisticsContent snapshot={snapshot} />
    case PerformanceTabType.Log:
      return <Trace type="LabAnalyze" entityId={snapshot.report.id.toString()} onlyPicked />
    default:
      return null
  }
}

type Props = {
  type: PerformanceTabType
  snapshots: SnapshotDetailType[]
}

export const MultiReportPivotContent = (props: Props) => {
  const { type, snapshots } = props
  switch (type) {
    case PerformanceTabType.Overview:
      return <MultiContentOverview snapshots={snapshots} />
    case PerformanceTabType.Breakdown:
      return <MultiContentBreakdown snapshots={snapshots} />
    default:
      return null
  }
}
