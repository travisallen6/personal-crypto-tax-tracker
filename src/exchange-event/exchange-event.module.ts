import { Module } from '@nestjs/common';
import { ExchangeEventController } from './exchange-event.controller';
import { KrakenService } from './kraken.service';

@Module({
  controllers: [ExchangeEventController],
  providers: [KrakenService],
  exports: [KrakenService],
})
export class ExchangeEventModule {}
