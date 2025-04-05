import { Injectable } from '@nestjs/common';
import { ChainEventService } from '../chain-event/chain-event.service';
import { ExchangeEventService } from '../exchange-event/exchange-event.service';
import { DisposalEvent } from './disposal-event';
import { Decimal } from 'decimal.js';

@Injectable()
export class DisposalEventService {
  constructor(
    private readonly chainEventService: ChainEventService,
    private readonly exchangeEventService: ExchangeEventService,
  ) {}

  private sortEvents(
    events: DisposalEvent[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ) {
    return events.sort((a, b) => {
      return sortOrder === 'ASC'
        ? a.timestamp.getTime() - b.timestamp.getTime()
        : b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  async getUnlinkedTotalQuantityByCurrency(
    userAddresses: string[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ) {
    const unlinkedDisposalEvents = await this.getUnlinkedDisposalEvents(
      userAddresses,
      sortOrder,
    );

    const initialValue: Record<string, Decimal> = {};

    return unlinkedDisposalEvents.reduce((acc, event) => {
      const currencyTotal = acc[event.currency];
      if (!currencyTotal) {
        acc[event.currency] = event.unaccountedCostBasisQuantity;

        return acc;
      }

      acc[event.currency] = currencyTotal.plus(
        event.unaccountedCostBasisQuantity,
      );

      return acc;
    }, initialValue);
  }

  async getLinkedDisposalEvents(
    userAddresses: string[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ) {
    const disposalEvents = await Promise.all([
      this.exchangeEventService.getLinkedDisposalExchangeEvents(sortOrder),
      this.chainEventService.getLinkedDisposalChainEvents(
        userAddresses,
        sortOrder,
      ),
    ]);

    return this.sortEvents(
      disposalEvents.flat().map((event) => new DisposalEvent(event)),
      sortOrder,
    );
  }

  async getUnlinkedDisposalEvents(
    userAddresses: string[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ) {
    const unlinkedDisposalExchangeEvents = await Promise.all([
      this.exchangeEventService.getUnlinkedDisposalExchangeEvents(sortOrder),
      this.chainEventService.getUnlinkedDisposalChainEvents(
        userAddresses,
        sortOrder,
      ),
    ]);

    return this.sortEvents(
      unlinkedDisposalExchangeEvents
        .flat()
        .map((event) => new DisposalEvent(event)),
      sortOrder,
    );
  }
}
