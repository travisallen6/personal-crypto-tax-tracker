import { Module } from '@nestjs/common';
import { ChainEventService } from './chain-event.service';
import { ChainEventController } from './chain-event.controller';

@Module({
  controllers: [ChainEventController],
  providers: [ChainEventService],
})
export class ChainEventModule {}
