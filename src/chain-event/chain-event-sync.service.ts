import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ChainEventService } from './chain-event.service';
import { EtherscanService } from './etherscan.service';
import { ChainEventDB, ChainEventTransaction } from './types/chain-event';
@Injectable()
export class ChainEventSyncService {
  private readonly logger = new Logger(ChainEventSyncService.name);

  constructor(
    private chainEventService: ChainEventService,
    private etherscanService: EtherscanService,
  ) {}

  private getMaxBlockNumber(chainEvents: ChainEventDB[]) {
    return Math.max(
      ...chainEvents.map(({ blockNumber }) => {
        return +blockNumber;
      }),
    );
  }

  private convertChainEventTransactionsToChainEventDBs(
    transactions: ChainEventTransaction[],
  ): ChainEventDB[] {
    return transactions.map((transaction) => {
      return {
        ...transaction,
        timeStamp: new Date(+transaction.timeStamp * 1000),
        blockNumber: +transaction.blockNumber,
        nonce: +transaction.nonce,
        tokenDecimal: +transaction.tokenDecimal,
        transactionIndex: +transaction.transactionIndex,
        gas: +transaction.gas,
        confirmations: +transaction.confirmations,
      };
    });
  }

  private async fetchChainEventTransactions(
    address: string,
    latestChainEventBlockNumber?: number,
  ) {
    const fetchFromBlock = latestChainEventBlockNumber
      ? latestChainEventBlockNumber + 1
      : 0;
    const chainEventTransactions =
      await this.etherscanService.getErc20Transfers(address, fetchFromBlock);

    if (chainEventTransactions.status === '0') {
      if (chainEventTransactions.message === 'No transactions found') {
        return [];
      }

      this.logger.error(
        `Failed to fetch chain event transactions for address ${address}`,
      );
      this.logger.error(chainEventTransactions);

      throw new InternalServerErrorException(
        `Failed to fetch chain event transactions for address ${address}`,
      );
    }

    return chainEventTransactions.result;
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
