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

import { Global, Module } from '@nestjs/common'

import { DBModule } from '@johfe/perfsee-platform-server/db'

import { CryptoService } from './crypto/crypto-service'
import { RxFetch } from './fetch'
import { InternalIdService } from './internal-id'
import { UrlService } from './url'

const services = [CryptoService, InternalIdService, RxFetch, UrlService]

@Global()
@Module({
  imports: [DBModule],
  providers: services,
  exports: services,
})
export class HelpersModule {}

export { CryptoService, InternalIdService, RxFetch, UrlService }
