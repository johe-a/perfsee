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

import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft } from 'immer'
import { endWith, exhaustMap, filter, map, Observable, startWith, withLatestFrom } from 'rxjs'

import { createErrorCatcher, GraphQLClient } from '@fe/perfsee-platform/common'
import { associatedGithubInstallationsQuery } from '@fe/perfsee-schema'

import { Installation } from './github-installation.module'

interface State {
  installations: Installation[]
  installationsTotalCount: number
  loading: boolean
}

@Module('AssociatedGithubInstallationsModel')
export class AssociatedGithubInstallationsModel extends EffectModule<State> {
  defaultState = {
    loading: true,
    installationsTotalCount: 0,
    installations: [],
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  loadMore(payload$: Observable<void>) {
    return payload$.pipe(
      withLatestFrom(this.state$),
      filter(([_, state]) => {
        return !(state.installations.length > 0 && state.installations.length === state.installationsTotalCount)
      }),
      exhaustMap(([_, state]) =>
        this.client
          .query({
            query: associatedGithubInstallationsQuery,
            variables: { pagination: { first: 30, skip: state.installations.length } },
          })
          .pipe(
            map((data) => {
              return this.getActions().append({
                installations: data.associatedGithubInstallations.edges.map((edge) => edge.node),
                totalCount: data.associatedGithubInstallations.pageInfo.totalCount,
              })
            }),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
            createErrorCatcher(),
          ),
      ),
    )
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  append(state: Draft<State>, { installations, totalCount }: { installations: Installation[]; totalCount: number }) {
    state.installations.push(...installations)
    state.installationsTotalCount = totalCount
  }
}
