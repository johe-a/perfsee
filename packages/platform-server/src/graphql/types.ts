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

import { GraphQLQuery, QueryVariables, RecursiveMaybeFields, QueryResponse } from '@fe/perfsee-schema'

// TODO duplicated
type AllowedRequestContent = Omit<RequestInit, 'method' | 'body' | 'signal'>

export type RequestOptions<Q extends GraphQLQuery> = {
  query: Q
  context?: AllowedRequestContent
  /**
   * files need to be uploaded
   *
   * When provided, the request body will be turned to multiparts to satisfy
   * file uploading scene.
   */
  files?: File[]
  /**
   * Whether keep null or undefined value in variables.
   *
   * if `false` given, `{ a: 0, v: undefined }` will be converted to `{ a: 0 }`
   *
   * @default true
   */
  keepNilVariables?: boolean
} & (QueryVariables<Q> extends never | Record<any, never>
  ? {
      variables?: undefined
    }
  : { variables: RecursiveMaybeFields<QueryVariables<Q>> })

export type QueryOptions<Q extends GraphQLQuery> = RequestOptions<Q>
export type MutationOptions<Q extends GraphQLQuery> = Omit<RequestOptions<Q>, 'query'> & {
  mutation: Q
}

export { GraphQLQuery, QueryResponse }

export interface RequestBody {
  operationName?: string
  variables: any
  query: string
  form?: FormData
}
