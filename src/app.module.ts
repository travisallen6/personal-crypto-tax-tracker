import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChainEventModule } from './chain-event/chain-event.module';
import { ChainEvent } from './chain-event/entities/chain-event.entity';
import config, { DBConfig } from './config/config';
import { LoggerModule } from './logger/logger.module';
import { ExchangeEventModule } from './exchange-event/exchange-event.module';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ExchangeEvent } from './exchange-event/entities/exchange-event.entity';
import { CryptoPrice } from './crypto-price/entities/crypto-price.entity';
import { CryptoPriceModule } from './crypto-price/crypto-price.module';
import { CostBasisModule } from './cost-basis/cost-basis.module';
import { CostBasis } from './cost-basis/entities/cost-basis.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    LoggerModule,
    ChainEventModule,
    ExchangeEventModule,
    CryptoPriceModule,
    CostBasisModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('db') as DBConfig;
        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.name,
          entities: [ChainEvent, ExchangeEvent, CryptoPrice, CostBasis],
          synchronize: dbConfig.autoSync,
          timezone: 'Z',
        };
      },
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
