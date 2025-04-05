import { Injectable } from '@nestjs/common';
import { ExchangeEventService } from './exchange-event.service';
import { KrakenService } from './kraken.service';
import { ExchangeEvent } from './types/exchange-event';
import { KrakenLedgerEntry } from './types/kraken-api-responses';
import Decimal from 'decimal.js';
import { getUnixTimestamp } from '../utils/date';

interface KrakenLedgerEntryWithLedgerId extends KrakenLedgerEntry {
  ledgerId: string;
}

@Injectable()
export class ExchangeEventSyncService {
  constructor(
    private readonly exchangeEventService: ExchangeEventService,
    private readonly krakenService: KrakenService,
  ) {}

  /**
   * Determines if there are more results to fetch and the next offset.
   * @param currentOffset - The current offset.
   * @param totalResultsCount - The total results count.
   * @param results - The results from the current page.
   */
  // {
  //   currentOffset,
  //   totalResultsCount,
  //   results,
  // }: PaginatedExchangeResponse<ExchangeEvent[]>
  private getNextOffset(
    currentOffset: number,
    totalResultsCount: number,
    resultLength: number,
  ): {
    shouldContinueSyncing: boolean;
    offset?: number;
  } {
    if (currentOffset + resultLength >= totalResultsCount) {
      return { shouldContinueSyncing: false };
    }

    return {
      shouldContinueSyncing: true,
      offset: currentOffset + resultLength,
    };
  }

  private convertTradeLedgersToExchangeEvents(
    tradeLedgers: Array<{
      tradeId: string;
      ledgers: KrakenLedgerEntryWithLedgerId[];
    }>,
  ): ExchangeEvent[] {
    return tradeLedgers.map(({ tradeId, ledgers }) => {
      const baseCurrency = ledgers.find((ledger) =>
        ledger.amount.startsWith('-'),
      );

      const quoteCurrency = ledgers.find(
        (ledger) => !ledger.amount.startsWith('-'),
      );

      if (!baseCurrency || !quoteCurrency) {
        throw new Error('Base or quote currency not found');
      }

      const baseCurrencyAsset = baseCurrency.asset;
      const quoteCurrencyAsset = quoteCurrency.asset;

      const baseCurrencyAmount = new Decimal(baseCurrency.amount);
      const quoteCurrencyAmount = new Decimal(quoteCurrency.amount);

      const type = baseCurrencyAsset === 'ZUSD' ? 'buy' : 'sell';

      const price = quoteCurrencyAmount.div(baseCurrencyAmount.abs());
      const cost =
        type === 'buy' ? baseCurrencyAmount.abs() : quoteCurrencyAmount.abs();
      const vol = cost.div(price);

      const baseFee = new Decimal(baseCurrency.fee);
      const quoteFee = new Decimal(quoteCurrency.fee);

      const earliestTimestamp = new Date(
        Math.min(baseCurrency.time * 1000, quoteCurrency.time * 1000),
      );

      return {
        baseCurrency: baseCurrencyAsset,
        quoteCurrency: quoteCurrencyAsset,
        txid: tradeId,
        pair: `${baseCurrencyAsset}${quoteCurrencyAsset}`,
        time: earliestTimestamp,
        type: type,
        price: price.toNumber(),
        cost: cost.toNumber(),
        baseFee: baseFee.toNumber(),
        quoteFee: quoteFee.toNumber(),
        vol: vol.toNumber(),
        ledgers: ledgers.map((ledger) => ledger.ledgerId),
        withdrawalFee: 0,
      };
    });
  }

  private groupLedgersByRefId(
    ledgers: KrakenLedgerEntryWithLedgerId[],
    targetLedgerType: 'trade' | 'deposit' | 'withdrawal',
  ): Array<{ tradeId: string; ledgers: KrakenLedgerEntryWithLedgerId[] }> {
    const groupedLedgers = ledgers.reduce(
      (acc, ledger) => {
        if (ledger.type !== targetLedgerType) {
          return acc;
        }

        if (!acc[ledger.refid]) {
          acc[ledger.refid] = [];
        }

        acc[ledger.refid].push(ledger);

        return acc;
      },
      {} as Record<string, KrakenLedgerEntryWithLedgerId[]>,
    );

    return Object.entries(groupedLedgers).map(([tradeId, ledgers]) => ({
      tradeId,
      ledgers,
    }));
  }

  async syncLedgers(
    start?: number,
    offset = 0,
    accumulatedLedger: Record<string, KrakenLedgerEntry> = {},
  ) {
    const startTimestamp =
      start ??
      (await this.exchangeEventService.findLatestExchangeEventTimestamp());

    // Allow the end time to continue advancing as we fetch more data
    const endTimestamp = getUnixTimestamp();

    const krakenLedgers = await this.krakenService.getLedgers(
      startTimestamp,
      endTimestamp,
      offset,
    );

    const { shouldContinueSyncing, offset: nextOffset } = this.getNextOffset(
      offset,
      krakenLedgers.count,
      Object.keys(krakenLedgers.ledger).length,
    );
    const updatedAccumulatedLedger = {
      ...accumulatedLedger,
      ...krakenLedgers.ledger,
    };
    if (shouldContinueSyncing) {
      await this.syncLedgers(
        startTimestamp,
        nextOffset,
        updatedAccumulatedLedger,
      );
    } else {
      const tradeLedgers = this.groupLedgersByRefId(
        Object.entries(updatedAccumulatedLedger).map(([ledgerId, ledger]) => ({
          ...ledger,
          ledgerId,
        })),
        'trade',
      );
      const exchangeEvents =
        this.convertTradeLedgersToExchangeEvents(tradeLedgers);

      await this.exchangeEventService.createMany(exchangeEvents);
    }
  }
}
