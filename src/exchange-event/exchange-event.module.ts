import { Module } from '@nestjs/common';
import { ExchangeEventController } from './exchange-event.controller';
import { KrakenService } from './kraken.service';
import { ExchangeEventService } from './exchange-event.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeEvent } from './entities/exchange-event.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([ExchangeEvent])],
  controllers: [ExchangeEventController],
  providers: [KrakenService, ExchangeEventService],
  exports: [],
})
export class ExchangeEventModule {}
