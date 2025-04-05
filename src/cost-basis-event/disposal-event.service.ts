import { Injectable } from '@nestjs/common';
import { ChainEventService } from '../chain-event/chain-event.service';
import { ExchangeEventService } from '../exchange-event/exchange-event.service';
import { DisposalEvent } from './disposal-event';

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

  async getLinkedDisposalEvents(sortOrder: 'ASC' | 'DESC' = 'ASC') {
    const disposalEvents = await Promise.all([
      this.exchangeEventService.getLinkedDisposalExchangeEvents(sortOrder),
      this.chainEventService.getLinkedDisposalChainEvents(sortOrder),
    ]);

    return this.sortEvents(
      disposalEvents.flat().map((event) => new DisposalEvent(event)),
      sortOrder,
    );
  }

  async getUnlinkedDisposalEvents(sortOrder: 'ASC' | 'DESC' = 'ASC') {
    const unlinkedDisposalExchangeEvents = await Promise.all([
      this.exchangeEventService.getUnlinkedDisposalExchangeEvents(sortOrder),
      this.chainEventService.getUnlinkedDisposalChainEvents(sortOrder),
    ]);

    return this.sortEvents(
      unlinkedDisposalExchangeEvents
        .flat()
        .map((event) => new DisposalEvent(event)),
      sortOrder,
    );
  }
}
