import { Module } from '@nestjs/common'

import { DBModule } from '@fe/perfsee-platform-server/db'

import { UsagePackResolver } from './resolver'
import { UsagePackService } from './service'

@Module({
  imports: [DBModule],
  providers: [UsagePackService, UsagePackResolver],
})
export class UsagePackModule {}
