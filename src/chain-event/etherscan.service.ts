import { ConfigService } from '@nestjs/config';
import { EtherscanConfig } from '../config/config';
import axios, { AxiosInstance } from 'axios';
import { Injectable } from '@nestjs/common';
import { ChainEventTransaction } from './types/chain-event-transaction';

interface EtherscanRequest {
  module: 'account';
  action: 'tokentx';
  address: string;
  startblock: number;
  endblock?: number;
  sort: 'asc' | 'desc';
}

interface EtherscanResponse<T> {
  status: '1' | '0';
  message: string;
  result: T;
}

@Injectable()
export class EtherscanService {
  client: AxiosInstance;

  constructor(configService: ConfigService) {
    const etherscanConfig =
      configService.getOrThrow<EtherscanConfig>('etherscan');

    this.buildAxiosClient(etherscanConfig.baseUrl, etherscanConfig.apiKey);
  }

  private buildAxiosClient(baseUrl: string, apiKey: string) {
    this.client = axios.create({
      baseURL: baseUrl,
    });

    this.client.interceptors.request.use((config) => {
      const params: Record<string, string> = {
        ...((config.params as Record<string, string>) || {}),
        apiKey,
      };
      const axiosConfig = Object.assign({}, config, { params });

      return axiosConfig;
    });
  }

  private async sendRequest<T>(
    requestParams: EtherscanRequest,
  ): Promise<EtherscanResponse<T>> {
    const result = await this.client.get<EtherscanResponse<T>>('', {
      params: requestParams,
    });

    return result.data;
  }

  public async getErc20Transfers(
    address: string,
    startBlock: number,
    endBlock?: number,
  ) {
    const requestParams: EtherscanRequest = {
      module: 'account',
      action: 'tokentx',
      address,
      startblock: startBlock,
      sort: 'asc',
    };

    if (endBlock && endBlock >= 0) {
      requestParams.endblock = endBlock;
    }

    return this.sendRequest<ChainEventTransaction[]>(requestParams);
  }
}
