import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ChainEventService } from './chain-event.service';
import { EtherscanService } from './etherscan.service';
import { ChainEventTransaction } from './types/chain-event-transaction';
import { ChainEvent } from './types/chain-event';
import { CryptoPriceSyncService } from '../crypto-price/crypto-price-sync.service';
import Decimal from 'decimal.js';

@Injectable()
export class ChainEventSyncService {
  private readonly logger = new Logger(ChainEventSyncService.name);

  constructor(
    private chainEventService: ChainEventService,
    private etherscanService: EtherscanService,
    private cryptoPriceSyncService: CryptoPriceSyncService,
  ) {}

  private getMaxBlockNumber(chainEvents: ChainEvent[]) {
    return Math.max(
      ...chainEvents.map(({ blockNumber }) => {
        return +blockNumber;
      }),
    );
  }

  private convertChainEventTransactionsToChainEvents(
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
      await this.syncChainEventsWithCryptoPrices();
      return;
    }

    const chainEvents = this.convertChainEventTransactionsToChainEvents(
      chainEventTransactions,
    );

    await this.chainEventService.createMany(chainEvents);

    await this.syncChainEvents(
      address,
      this.getMaxBlockNumber(chainEvents) + 1,
    );
  }

  public async syncChainEventsWithCryptoPrices() {
    const chainEvents =
      await this.chainEventService.findChainEventsMissingCryptoPrice();

    if (chainEvents.length === 0) {
      this.logger.log('No chain events missing crypto prices');
      return;
    }

    const cryptoPrices =
      await this.cryptoPriceSyncService.populateMissingCryptoPrices(
        chainEvents,
      );

    this.logger.log(`Found ${cryptoPrices.length} crypto prices to update`);
    const results =
      await this.chainEventService.updateChainEventsWithCryptoPrice(
        cryptoPrices,
      );

    const affectedCount = results.reduce(
      (acc, result) => acc + (result.affected ?? 0),
      0,
    );

    this.logger.log(
      `Updated ${affectedCount} chain events with crypto price IDs`,
    );
  }

  public async getChainEventsFromTransactionHashes(
    transactionHashes: string[],
    recipientAddress: string,
  ): Promise<ChainEvent[]> {
    const transactionHashSet = new Set(transactionHashes);

    const transactions = await Promise.all(
      transactionHashes.map((transactionHash) =>
        this.etherscanService
          .getTransaction(transactionHash)
          .then((etherscanResponse) => etherscanResponse.result),
      ),
    );

    const erc20Transfers = await Promise.all(
      transactions.map(async (transaction) => {
        const blockNumber = parseInt(transaction.blockNumber, 16);
        const transfers = await this.etherscanService.getErc20Transfers(
          recipientAddress,
          blockNumber,
          blockNumber,
        );

        return transfers.result;
      }),
    );

    const targetErc20Transfers = erc20Transfers.flatMap((erc20Transfers) =>
      erc20Transfers.filter((transfer) =>
        transactionHashSet.has(transfer.hash),
      ),
    );

    if (targetErc20Transfers.length !== transactionHashes.length) {
      this.logger.error(
        `Unable to find all target ERC20 transfers for transaction hashes ${transactionHashes.join(', ')}`,
      );

      throw new InternalServerErrorException(
        `Unable to find all target ERC20 transfers for transaction hashes ${transactionHashes.join(', ')}`,
      );
    }

    return this.convertChainEventTransactionsToChainEvents(
      targetErc20Transfers,
    );
  }

  public async createChainEventsFromTransactionHashes(
    transactionHashes: string[],
    recipientAddress: string,
  ) {
    const chainEvents = await this.getChainEventsFromTransactionHashes(
      transactionHashes,
      recipientAddress,
    );

    await this.chainEventService.createMany(chainEvents);

    return chainEvents;
  }

  public async adjustTransactionValue(
    targetTransactionHash: string,
    adjustmentQuantity: Decimal,
  ) {
    const targetChainEvent = await this.chainEventService.findByTransactionHash(
      targetTransactionHash,
    );

    if (!targetChainEvent) {
      this.logger.error(
        `Unable to find target chain event for transaction hash ${targetTransactionHash}`,
      );

      throw new InternalServerErrorException(
        `Unable to find target chain event for transaction hash ${targetTransactionHash}`,
      );
    }

    const totalAdjustmentQuantity = new Decimal(
      targetChainEvent.valueAdjustment ?? 0,
    ).plus(adjustmentQuantity);

    const currentValue = new Decimal(targetChainEvent.value);

    if (currentValue.plus(totalAdjustmentQuantity).lt(0)) {
      this.logger.error(
        `Total adjustment quantity for transaction hash ${targetTransactionHash} is greater than the current value`,
      );

      throw new InternalServerErrorException(
        `Total adjustment quantity for transaction hash ${targetTransactionHash} is greater than the current value`,
      );
    }

    return this.chainEventService.adjustChainEventValue(
      targetChainEvent.id,
      totalAdjustmentQuantity,
    );
  }
}
