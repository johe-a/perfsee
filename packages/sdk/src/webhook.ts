import type {
  BundleFinishedEventQuery,
  SourceFinishedEventQuery,
  LabSnapshotCompletedEventQuery,
  LabSnapshotReportCompletedEventQuery,
} from '@fe/perfsee-schema'
import type { WebhookEventType } from '@fe/perfsee-shared'

type WebhookPayload<T> = { data: T }

// use generics to check this type stay in sync with @fe/perfsee-shared
type GenerateWebhookEvent<T extends Record<WebhookEventType['key'], any>> = {
  [key in keyof T]: { eventType: key; payload: WebhookPayload<T[key]> }
}[keyof T]

export type WebhookEvent = GenerateWebhookEvent<{
  'bundle:finished': BundleFinishedEventQuery
  'lab:snapshot-completed': LabSnapshotCompletedEventQuery
  'lab:snapshot-report-completed': LabSnapshotReportCompletedEventQuery
  'source:finished': SourceFinishedEventQuery
}>
