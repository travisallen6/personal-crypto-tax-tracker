import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import stringify from 'json-stringify-deterministic';
import crypto from 'crypto';
import { ChainEventService } from './chain-event.service';
import { EtherscanService } from './etherscan.service';
import { ChainEventTransaction } from './types/chain-event-transaction';
import { ChainEvent } from './types/chain-event';

@Injectable()
export class ChainEventSyncService {
  private readonly logger = new Logger(ChainEventSyncService.name);

  constructor(
    private chainEventService: ChainEventService,
    private etherscanService: EtherscanService,
  ) {}

  private getMaxBlockNumber(chainEvents: ChainEvent[]) {
    return Math.max(
      ...chainEvents.map(({ blockNumber }) => {
        return +blockNumber;
      }),
    );
  }

  private calculateChainEventUniqueId(transaction: ChainEventTransaction) {
    const stringified = stringify(transaction);

    return crypto.createHash('sha1').update(stringified).digest('hex');
  }

  private convertChainEventTransactionsToChainEventDBs(
    transactions: ChainEventTransaction[],
  ): ChainEvent[] {
    return transactions.map((transaction) => {
      return {
        ...transaction,
        transactionHash: transaction.hash,
        timeStamp: new Date(+transaction.timeStamp * 1000),
        blockNumber: +transaction.blockNumber,
        nonce: +transaction.nonce,
        tokenDecimal: +transaction.tokenDecimal,
        transactionIndex: +transaction.transactionIndex,
        gas: +transaction.gas,
        confirmations: +transaction.confirmations,
        chainEventUniqueId: this.calculateChainEventUniqueId(transaction),
      };
    });
  }

  private async fetchChainEventTransactions(
    address: string,
    latestChainEventBlockNumber?: number,
  ): Promise<ChainEventTransaction[]> {
    const fetchFromBlock = latestChainEventBlockNumber
      ? latestChainEventBlockNumber + 1
      : 0;
    const etherscanResult = await this.etherscanService.getErc20Transfers(
      address,
      fetchFromBlock,
    );

    if (etherscanResult.status === '0') {
      if (etherscanResult.message === 'No transactions found') {
        return [];
      }

      this.logger.error(
        `Failed to fetch chain event transactions for address ${address}`,
      );
      this.logger.error(etherscanResult);

      throw new InternalServerErrorException(
        `Failed to fetch chain event transactions for address ${address}`,
      );
    }
    return etherscanResult.result;
  }

  async syncChainEvents(address: string, startBlock?: number) {
    let latestChainEventBlockNumber = startBlock;

    if (!startBlock) {
      latestChainEventBlockNumber =
        await this.chainEventService.findLatestChainEventBlockNumber();
    }

    const chainEventTransactions = await this.fetchChainEventTransactions(
      address,
      latestChainEventBlockNumber,
    );

    if (chainEventTransactions.length === 0) {
      return;
    }

    const chainEvents = this.convertChainEventTransactionsToChainEventDBs(
      chainEventTransactions,
    );

    await this.chainEventService.createMany(chainEvents);

    await this.syncChainEvents(
      address,
      this.getMaxBlockNumber(chainEvents) + 1,
    );
  }
}
