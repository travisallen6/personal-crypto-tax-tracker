import { ConfigService } from '@nestjs/config';
import { KrakenConfig } from '../config/config';
import axios, { AxiosInstance } from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as querystring from 'querystring';
import { KrakenLedgerResponse } from './types/kraken-api-responses';

interface KrakenResponse<T> {
  error: string[];
  result: T;
}

@Injectable()
export class KrakenService {
  private readonly logger = new Logger(KrakenService.name);
  private client: AxiosInstance;

  private krakenConfig: KrakenConfig;

  constructor(configService: ConfigService) {
    this.krakenConfig = configService.getOrThrow<KrakenConfig>('kraken');
    this.buildAxiosClient(this.krakenConfig.baseUrl);
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
    const secret = Buffer.from(this.krakenConfig.apiSecret, 'base64');

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
            'API-Key': this.krakenConfig.apiKey,
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
   * Fetches ledger entries from Kraken
   * @param start Optional UNIX timestamp to start from
   * @param end Optional UNIX timestamp to end at
   * @param offset Result offset for pagination
   * @returns Paginated ledger entries
   */
  public async getLedgers(
    start?: number,
    end?: number,
    offset?: number,
  ): Promise<KrakenLedgerResponse> {
    const params: Record<string, any> = {};

    if (start) {
      params.start = start;
    }

    if (end) {
      params.end = end;
    }

    if (offset) {
      params.ofs = offset || 0;
    }

    this.logger.log(`Getting ledgers from Kraken: ${JSON.stringify(params)}`);

    const response = await this.sendRequest<KrakenLedgerResponse>(
      '0/private/Ledgers',
      params,
    );

    this.logger.log(
      `Kraken ledgers response: ${Object.keys(response.result.ledger || {}).length} entries`,
    );

    return response.result;
  }
}
