import { Module } from '@nestjs/common';
import { ChainEventService } from './chain-event.service';
import { ChainEventController } from './chain-event.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EtherscanService } from './etherscan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChainEvent } from './entities/chain-event.entity';
import { ChainEventSyncService } from './chain-event-sync.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([ChainEvent])],
  controllers: [ChainEventController],
  providers: [
    ConfigService,
    EtherscanService,
    ChainEventService,
    ChainEventSyncService,
  ],
})
export class ChainEventModule {}
