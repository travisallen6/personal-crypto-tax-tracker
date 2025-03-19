import { ConfigService } from '@nestjs/config';
import { KrakenConfig } from '../config/config';
import axios, { AxiosInstance } from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as querystring from 'querystring';
import { PaginatedExchangeResponse } from './types/exchange-event';
import {
  KrakenTradeTransaction,
  KrakenTradeTransactionRaw,
} from './types/exchange-transaction';

interface KrakenResponse<T> {
  error: string[];
  result: T;
}

@Injectable()
export class KrakenService {
  private readonly logger = new Logger(KrakenService.name);
  private client: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;

  constructor(configService: ConfigService) {
    const krakenConfig = configService.getOrThrow<KrakenConfig>('kraken');
    this.apiKey = krakenConfig.apiKey;
    this.apiSecret = krakenConfig.apiSecret;
    this.buildAxiosClient(krakenConfig.baseUrl);
  }

  private buildAxiosClient(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Crypto-Taxes/1.0',
      },
    });
  }

  private getMessageSignature(
    path: string,
    nonce: number,
    postData: string,
  ): string {
    const message = postData;
    const secret = Buffer.from(this.apiSecret, 'base64');

    const hash = crypto.createHash('sha256');
    const hmac = crypto.createHmac('sha512', secret);

    const hashDigest = hash.update(nonce + message).digest('binary');
    const hmacDigest = hmac
      .update(path + hashDigest, 'binary')
      .digest('base64');

    return hmacDigest;
  }

  private async sendRequest<T>(
    endpoint: string,
    data: Record<string, any> = {},
  ): Promise<KrakenResponse<T>> {
    const path = `/${endpoint}`;
    const nonce = Date.now();

    const postData = querystring.stringify({
      nonce,
      ...data,
    });

    try {
      const response = await this.client.post<KrakenResponse<T>>(
        path,
        postData,
        {
          headers: {
            'API-Key': this.apiKey,
            'API-Sign': this.getMessageSignature(path, nonce, postData),
          },
        },
      );

      if (response.data.error && response.data.error.length > 0) {
        this.logger.error(
          `Kraken API error: ${response.data.error.join(', ')}`,
        );
        throw new Error(`Kraken API error: ${response.data.error.join(', ')}`);
      }

      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error calling Kraken API: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Convert a raw trade transaction to a trade transaction
   * @param rawTradeDictionary The raw trade transaction dictionary from the Kraken API
   * @returns The trade transaction array
   */
  private convertTradeTransactionRawToTradeTransaction(
    rawTradeDictionary: Record<string, KrakenTradeTransactionRaw>,
  ): KrakenTradeTransaction[] {
    return Object.entries(rawTradeDictionary).map(([txid, rawTrade]) => ({
      ...rawTrade,
      txid,
      time: new Date(rawTrade.time * 1000),
      price: parseFloat(rawTrade.price),
      cost: parseFloat(rawTrade.cost),
      fee: parseFloat(rawTrade.fee),
      vol: parseFloat(rawTrade.vol),
      margin: parseFloat(rawTrade.margin),
      leverage: parseFloat(rawTrade.leverage),
    }));
  }

  /**
   * Apply pagination metadata to the result
   * @param offset The offset of the result
   * @param resultCount The number of results in the current page
   * @param totalCount The total number of results
   * @param result The result array
   * @returns The paginated exchange response
   */
  private applyPaginationMetadata<T>(
    offset: number,
    resultCount: number,
    totalCount: number,
    results: T[],
  ): PaginatedExchangeResponse<T[]> {
    return {
      hasNextPage: offset + resultCount < totalCount,
      currentPage: Math.floor(offset / resultCount) + 1,
      results,
      resultsCount: results.length,
    };
  }

  /**
   * Get closed trades from Kraken
   * @param start Optional UNIX timestamp to start from
   * @param end Optional UNIX timestamp to end at
   * @param offset Result offset for pagination
   * @returns Array of trade transactions
   */
  public async getClosedTrades(
    start?: number,
    end?: number,
    offset?: number,
  ): Promise<PaginatedExchangeResponse<KrakenTradeTransaction[]>> {
    const params: Record<string, any> = {};

    if (start) {
      params.start = start;
    }

    if (end) {
      params.end = end;
    }

    if (offset) {
      params.ofs = offset;
    }

    const response = await this.sendRequest<{
      trades: Record<string, KrakenTradeTransactionRaw>;
      count: number;
    }>('0/private/TradesHistory', params);

    const tradeTransactions = this.convertTradeTransactionRawToTradeTransaction(
      response.result.trades,
    );

    return this.applyPaginationMetadata(
      offset || 0,
      tradeTransactions.length,
      response.result.count,
      tradeTransactions,
    );
  }

  /**
   * Get only sell trades from Kraken
   * @param start Optional UNIX timestamp to start from
   * @param end Optional UNIX timestamp to end at
   * @returns Array of sell trade transactions
   */
  public async getSellTrades(
    start?: number,
    end?: number,
  ): Promise<PaginatedExchangeResponse<KrakenTradeTransaction[]>> {
    const allTrades = await this.getClosedTrades(start, end);

    // Filter to only include sell trades
    return {
      ...allTrades,
      results: allTrades.results.filter((trade) => trade.type === 'sell'),
    };
  }
}
