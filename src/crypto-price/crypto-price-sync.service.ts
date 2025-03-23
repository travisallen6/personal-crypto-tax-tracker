import { Injectable, Logger } from '@nestjs/common';
import { getHourTimeRange } from '../utils/date';
import { CryptoPriceService } from './crypto-price.service';
import { CoinGeckoService } from './coin-gecko.service';
import { CryptoPriceDB } from './types/crypo-price';
import {
  ChainEventDB,
  ChainEventIdWithCryptoPriceId,
} from '../chain-event/types/chain-event';

@Injectable()
export class CryptoPriceSyncService {
  private readonly logger = new Logger(CryptoPriceSyncService.name);
  constructor(
    private cryptoPriceService: CryptoPriceService,
    private coinGeckoService: CoinGeckoService,
  ) {}
  /**
   * Fetch the price of a token at the time of a transaction
   * @param symbol The token symbol
   * @param timestamp The timestamp of the transaction
   * @returns The price data or null if not found
   */
  private async ensureTokenPriceAtTransactionTimestamp(
    symbol: string,
    timestamp: Date,
  ): Promise<CryptoPriceDB | null> {
    try {
      const existingPrice =
        await this.cryptoPriceService.findPriceBySymbolAndTimestamp(
          symbol,
          timestamp,
        );

      if (existingPrice) {
        return existingPrice;
      }

      const priceData = await this.coinGeckoService.getTokenPriceAtTimestamp(
        symbol,
        timestamp,
      );

      if (priceData) {
        const [rangeStartTimestamp, rangeEndTimestamp] = getHourTimeRange(
          priceData.timestamp,
        );
        const newCryptoPrice = await this.cryptoPriceService.create({
          price: priceData.price,
          symbol: priceData.symbol,
          timestamp: priceData.timestamp,
          rangeStartTimestamp,
          rangeEndTimestamp,
        });

        return newCryptoPrice;
      }

      return priceData;
    } catch (error) {
      this.logger.error(
        `Failed to get price for ${symbol} at ${timestamp.toISOString()}`,
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  async populateMissingCryptoPrices(
    chainEvents: ChainEventDB[],
  ): Promise<ChainEventIdWithCryptoPriceId[]> {
    const chainEventPrices: ChainEventIdWithCryptoPriceId[] = [];
    for (const event of chainEvents) {
      const priceData = await this.ensureTokenPriceAtTransactionTimestamp(
        event.tokenSymbol,
        event.timeStamp,
      );

      if (priceData) {
        chainEventPrices.push({ id: event.id, cryptoPriceId: priceData.id });
      } else {
        this.logger.warn(
          `Could not resolve price data for ${event.tokenSymbol} at ${event.timeStamp.toISOString()}`,
        );
      }
    }

    return chainEventPrices;
  }
}
