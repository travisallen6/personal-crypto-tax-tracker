import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { getUnixTimestamp } from '../utils/date';
import { ConfigService } from '@nestjs/config';
import { CoinGeckoConfig } from '../config/config';
import difficultPrices from '../data/difficult-prices';
import { subDays, subYears } from 'date-fns';
export interface CoinGeckoMarketHistoryResponse {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface TokenPriceData {
  timestamp: Date;
  price: number;
  symbol: string;
}

@Injectable()
export class CoinGeckoService {
  private readonly logger = new Logger(CoinGeckoService.name);
  private client: AxiosInstance;

  private priceInterval: number;
  private coinIdMap: Record<string, string>;

  private difficultPrices: Map<string, TokenPriceData>;

  constructor(private config: ConfigService) {
    const coinGeckoConfig =
      this.config.getOrThrow<CoinGeckoConfig>('coinGecko');
    this.priceInterval = coinGeckoConfig.timestampRangeInterval;
    this.coinIdMap = coinGeckoConfig.coinIdMap;
    this.initializeClient(coinGeckoConfig.apiKey);
    this.initializeDifficultPrices();
  }

  private buildDifficultPricesKey(symbol: string, timestamp: Date) {
    return `${symbol}-${timestamp.toISOString()}`;
  }

  private initializeDifficultPrices() {
    this.difficultPrices = new Map(
      difficultPrices.map(({ price, timeStamp, tokenSymbol }) => [
        this.buildDifficultPricesKey(tokenSymbol, timeStamp),
        {
          timestamp: new Date(timeStamp),
          price,
          symbol: tokenSymbol,
        },
      ]),
    );
  }

  private initializeClient(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.coingecko.com/api/v3',
      timeout: 10000,
      headers: {
        'x-cg-demo-api-key': apiKey,
      },
    });
  }

  /**
   * Get the price of a token at a specific timestamp
   * @param symbol The token symbol (e.g., 'ETH', 'BTC')
   * @param timestamp The timestamp to get the price for
   * @returns The price data or null if not found
   */
  async getTokenPriceAtTimestamp(
    symbol: string,
    timestamp: Date,
  ): Promise<TokenPriceData | null> {
    try {
      const existingDifficultPrice = this.difficultPrices.get(
        this.buildDifficultPricesKey(symbol, timestamp),
      );
      if (existingDifficultPrice) {
        return existingDifficultPrice;
      }
      const oneYearAgo = subDays(subYears(new Date(), 1), 1);
      if (timestamp < oneYearAgo) {
        this.logger.warn(
          `Timestamp ${timestamp.toISOString()} is before ${oneYearAgo.toISOString()}`,
        );
        return null;
      }
      const coinId = this.getCoinIdFromSymbol(symbol);
      if (!coinId) {
        this.logger.warn(`No coin ID mapping found for symbol: ${symbol}`);
        return null;
      }

      const targetTimestamp = timestamp.getTime();

      // Fetch data from 1 day before to 1 day after to ensure we have data points
      const fromTimestamp = new Date(targetTimestamp - this.priceInterval);
      const toTimestamp = new Date(targetTimestamp + this.priceInterval);

      const response = await this.client.get<CoinGeckoMarketHistoryResponse>(
        `/coins/${coinId}/market_chart/range`,
        {
          params: {
            vs_currency: 'usd',
            from: getUnixTimestamp(fromTimestamp),
            to: getUnixTimestamp(toTimestamp),
          },
        },
      );

      // Find the closest price point to the target timestamp
      const prices = response.data.prices;
      if (!prices || prices.length === 0) {
        this.logger.warn(
          `No price data found for ${symbol} at ${timestamp.toISOString()}`,
        );
        return null;
      }

      let closestPrice = prices[0];
      let smallestDiff = Math.abs(targetTimestamp - prices[0][0]);

      for (const pricePoint of prices) {
        const diff = Math.abs(targetTimestamp - pricePoint[0]);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestPrice = pricePoint;
        }
      }

      return {
        timestamp: new Date(closestPrice[0]),
        price: closestPrice[1],
        symbol,
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }

      this.logger.error(
        `Failed to fetch price for ${symbol} at ${timestamp.toISOString()}: ${errorMessage}`,
      );
      return null;
    }
  }

  /**
   * Convert token symbol to CoinGecko coin ID
   */
  private getCoinIdFromSymbol(symbol: string): string | null {
    const upperSymbol = symbol.toUpperCase();
    return this.coinIdMap[upperSymbol] || null;
  }
}
