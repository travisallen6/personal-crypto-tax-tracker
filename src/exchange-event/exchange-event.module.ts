import { Module } from '@nestjs/common';
import { ExchangeController } from './exchange.controller';
import { KrakenService } from './kraken.service';
import { ExchangeEventService } from './exchange-event.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeEvent } from './entities/exchange-event.entity';
import { ConfigModule } from '@nestjs/config';
import { ExchangeEventSyncService } from './exchange-event-sync.service';
import { ExchangeEventController } from './exchange-event.controller';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([ExchangeEvent])],
  controllers: [ExchangeController, ExchangeEventController],
  providers: [KrakenService, ExchangeEventService, ExchangeEventSyncService],
  exports: [],
})
export class ExchangeEventModule {}
