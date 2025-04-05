import { Module } from '@nestjs/common';
import { AcquisitionEventService } from './acquisition-event.service';
import { DisposalEventService } from './disposal-event.service';
import { ChainEventModule } from '../chain-event/chain-event.module';
import { ExchangeEventModule } from '../exchange-event/exchange-event.module';

@Module({
  imports: [ChainEventModule, ExchangeEventModule],
  providers: [AcquisitionEventService, DisposalEventService],
  exports: [AcquisitionEventService, DisposalEventService],
})
export class CostBasisEventModule {}
