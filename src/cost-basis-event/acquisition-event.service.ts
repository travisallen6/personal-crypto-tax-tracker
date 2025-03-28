import { Injectable } from '@nestjs/common';
import { ChainEventService } from '../chain-event/chain-event.service';
import { ExchangeEventService } from '../exchange-event/exchange-event.service';
import { AcquisitionEvent } from './acquisition-event';

@Injectable()
export class AcquisitionEventService {
  constructor(
    private readonly chainEventService: ChainEventService,
    private readonly exchangeEventService: ExchangeEventService,
  ) {}

  private sortAcquisitionEvents(
    acquisitionEvents: AcquisitionEvent[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): AcquisitionEvent[] {
    return acquisitionEvents.sort((a, b) =>
      sortOrder === 'ASC'
        ? a.timestamp.getTime() - b.timestamp.getTime()
        : b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  async getLinkedAcquisitionEvents(
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<AcquisitionEvent[]> {
    const acquisitionEvents = await Promise.all([
      this.exchangeEventService.getLinkedAcquisitionExchangeEvents(sortOrder),
      this.chainEventService.getLinkedAcquisitionChainEvents(sortOrder),
    ]);

    return this.sortAcquisitionEvents(
      acquisitionEvents.flat().map((event) => new AcquisitionEvent(event)),
      sortOrder,
    );
  }

  async getUnlinkedAcquisitionEvents(
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<AcquisitionEvent[]> {
    const unlinkedAcquisitionExchangeEvents = await Promise.all([
      this.exchangeEventService.getUnlinkedAcquisitionExchangeEvents(sortOrder),
      this.chainEventService.getUnlinkedAcquisitionChainEvents(sortOrder),
    ]);

    return this.sortAcquisitionEvents(
      unlinkedAcquisitionExchangeEvents
        .flat()
        .map((event) => new AcquisitionEvent(event)),
      sortOrder,
    );
  }
}
