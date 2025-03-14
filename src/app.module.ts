import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChainEventModule } from './chain-event/chain-event.module';
import { ChainEvent } from './chain-event/entities/chain-event.entity';
import config, { DBConfig } from './config/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    ChainEventModule,
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
          entities: [ChainEvent],
          synchronize: dbConfig.autoSync,
        };
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
