import { Module } from '@nestjs/common';
import { CostBasisService } from './cost-basis.service';
import { CostBasisController } from './cost-basis.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostBasis } from './entities/cost-basis.entity';
import { CostBasisSyncService } from './cost-basis-sync.service';
import { ExchangeEventModule } from '../exchange-event/exchange-event.module';
import { ChainEventModule } from '../chain-event/chain-event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CostBasis]),
    ExchangeEventModule,
    ChainEventModule,
  ],
  controllers: [CostBasisController],
  providers: [CostBasisService, CostBasisSyncService],
  exports: [CostBasisService, CostBasisSyncService],
})
export class CostBasisModule {}
