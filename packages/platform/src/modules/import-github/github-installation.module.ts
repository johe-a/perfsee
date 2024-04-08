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
import { endWith, switchMap, map, Observable, startWith } from 'rxjs'

import { createErrorCatcher, GraphQLClient } from '@johfe/perfsee-platform/common'
import { githubInstallationQuery, GithubInstallationQuery } from '@johfe/perfsee-schema'

export type Installation = NonNullable<GithubInstallationQuery['githubInstallation']>

interface State {
  installation: Installation | null
  loading: boolean
}

@Module('GithubInstallationModel')
export class GithubInstallationModel extends EffectModule<State> {
  defaultState = {
    loading: true,
    installation: null,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  getInstallation(payload$: Observable<void>) {
    return payload$.pipe(
      switchMap(() =>
        this.client
          .query({
            query: githubInstallationQuery,
          })
          .pipe(
            map((data) => {
              return this.getActions().setInstallation(data.githubInstallation)
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
  setInstallation(state: Draft<State>, payload: Installation | null) {
    state.installation = payload
  }
}
