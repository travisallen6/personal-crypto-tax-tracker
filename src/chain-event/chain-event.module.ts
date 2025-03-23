import { Module } from '@nestjs/common';
import { ChainEventService } from './chain-event.service';
import { ChainEventController } from './chain-event.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EtherscanService } from './etherscan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChainEvent } from './entities/chain-event.entity';
import { ChainEventSyncService } from './chain-event-sync.service';
import { CryptoPriceModule } from '../crypto-price/crypto-price.module';
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ChainEvent]),
    CryptoPriceModule,
  ],
  controllers: [ChainEventController],
  providers: [
    ConfigService,
    EtherscanService,
    ChainEventService,
    ChainEventSyncService,
  ],
  exports: [ChainEventService],
})
export class ChainEventModule {}
