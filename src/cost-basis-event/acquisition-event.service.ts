import { Injectable } from '@nestjs/common';
import { ChainEventService } from '../chain-event/chain-event.service';
import { ExchangeEventService } from '../exchange-event/exchange-event.service';
import { AcquisitionEvent } from './acquisition-event';
import Decimal from 'decimal.js';

@Injectable()
export class AcquisitionEventService {
  constructor(
    private readonly chainEventService: ChainEventService,
    private readonly exchangeEventService: ExchangeEventService,
  ) {}

  async getUnlinkedTotalQuantityByCurrency(
    userAddresses: string[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ) {
    const unlinkedAcquisitionEvents = await this.getUnlinkedAcquisitionEvents(
      userAddresses,
      sortOrder,
    );

    const initialValue: Record<string, Decimal> = {};

    return unlinkedAcquisitionEvents.reduce((acc, event) => {
      const currencyTotal = acc[event.currency];
      if (!currencyTotal) {
        acc[event.currency] = event.availableCostBasisQuantity;
        return acc;
      }

      acc[event.currency] = currencyTotal.plus(
        event.availableCostBasisQuantity,
      );

      return acc;
    }, initialValue);
  }

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
    userAddresses: string[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<AcquisitionEvent[]> {
    const acquisitionEvents = await Promise.all([
      this.exchangeEventService.getLinkedAcquisitionExchangeEvents(sortOrder),
      this.chainEventService.getLinkedAcquisitionChainEvents(
        userAddresses,
        sortOrder,
      ),
    ]);

    return this.sortAcquisitionEvents(
      acquisitionEvents.flat().map((event) => new AcquisitionEvent(event)),
      sortOrder,
    );
  }

  async getUnlinkedAcquisitionEvents(
    userAddresses: string[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<AcquisitionEvent[]> {
    const unlinkedAcquisitionExchangeEvents = await Promise.all([
      this.exchangeEventService.getUnlinkedAcquisitionExchangeEvents(sortOrder),
      this.chainEventService.getUnlinkedAcquisitionChainEvents(
        userAddresses,
        sortOrder,
      ),
    ]);

    const acquisitionEvents = this.sortAcquisitionEvents(
      unlinkedAcquisitionExchangeEvents
        .flat()
        .map((event) => new AcquisitionEvent(event)),
      sortOrder,
    );

    return acquisitionEvents;
  }
}
