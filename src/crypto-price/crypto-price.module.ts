import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinGeckoService } from './coin-gecko.service';
import { CryptoPrice } from './entities/crypto-price.entity';
import { CryptoPriceService } from './crypto-price.service';
import { CryptoPriceSyncService } from './crypto-price-sync.service';
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([CryptoPrice])],
  controllers: [],
  providers: [
    ConfigService,
    CoinGeckoService,
    CryptoPriceService,
    CryptoPriceSyncService,
  ],
  exports: [CryptoPriceSyncService],
})
export class CryptoPriceModule {}
