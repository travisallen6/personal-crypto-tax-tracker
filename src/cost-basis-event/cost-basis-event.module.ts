import { Module } from '@nestjs/common';
import { AcquisitionEventService } from './acquisition-event.service';
import { DisposalEventService } from './disposal-event.service';

@Module({
  imports: [],
  providers: [AcquisitionEventService, DisposalEventService],
  exports: [AcquisitionEventService, DisposalEventService],
})
export class CostBasisEventModule {}
