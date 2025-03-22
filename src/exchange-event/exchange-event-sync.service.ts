import { Injectable } from '@nestjs/common';
import { ExchangeEventService } from './exchange-event.service';
import { KrakenService } from './kraken.service';
import { getUnixTimestamp } from '../utils/date';
import {
  ExchangeEvent,
  PaginatedExchangeResponse,
} from './types/exchange-event';
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
  private getNextOffset({
    currentOffset,
    totalResultsCount,
    results,
  }: PaginatedExchangeResponse<ExchangeEvent[]>): {
    shouldContinueSyncing: boolean;
    offset?: number;
  } {
    if (currentOffset + results.length >= totalResultsCount) {
      return { shouldContinueSyncing: false };
    }

    return {
      shouldContinueSyncing: true,
      offset: currentOffset + results.length,
    };
  }

  /**
   * Syncs exchange events from Kraken to the database.
   * @param start - The start timestamp for the sync.
   * @param end - The end timestamp for the sync.
   * @param offset - The offset for the sync. Primarily used in the recursive call
   */

  async syncExchangeEvents(start?: number, offset = 0) {
    const startTimestamp =
      start ??
      (await this.exchangeEventService.findLatestExchangeEventTimestamp());

    // Allow the end time to continue advancing as we fetch more data
    const endTimestamp = getUnixTimestamp();

    const krakenEvents = await this.krakenService.getClosedTrades(
      startTimestamp,
      endTimestamp,
      offset,
    );

    await this.exchangeEventService.createMany(krakenEvents.results);

    const { shouldContinueSyncing, offset: nextOffset } =
      this.getNextOffset(krakenEvents);

    if (shouldContinueSyncing) {
      await this.syncExchangeEvents(startTimestamp, nextOffset);
    }
  }
}
