import { ChainEventDB } from '../chain-event/types/chain-event';
import { CostBasis } from '../cost-basis/entities/cost-basis.entity';
import { ExchangeEventDB } from '../exchange-event/types/exchange-event';
import { Decimal } from 'decimal.js';

export class AcquisitionEvent {
  public id: number;
  public quantity: Decimal;
  public currency: string;
  private protectedAvailableCostBasisQuantity: Decimal;
  public timestamp: Date;

  constructor(private event: ChainEventDB | ExchangeEventDB) {
    if (this.isChainEvent(event)) {
      this.buildFromChainEvent(event);
    } else if (this.isExchangeEvent(event)) {
      this.buildFromExchangeEvent(event);
    }
  }

  get availableCostBasisQuantity() {
    return this.protectedAvailableCostBasisQuantity;
  }

  get acquisitionIdProperty(): keyof CostBasis {
    return this.isChainEvent(this.event)
      ? 'acquisitionChainEventId'
      : 'acquisitionExchangeEventId';
  }

  private isChainEvent(
    event: ChainEventDB | ExchangeEventDB,
  ): event is ChainEventDB {
    return (event as ChainEventDB).tokenSymbol !== undefined;
  }

  private isExchangeEvent(
    event: ChainEventDB | ExchangeEventDB,
  ): event is ExchangeEventDB {
    return (event as ExchangeEventDB).type !== undefined;
  }

  public get isExhausted(): boolean {
    return this.protectedAvailableCostBasisQuantity.lessThanOrEqualTo(0);
  }

  private buildFromChainEvent(event: ChainEventDB) {
    this.id = event.id;
    this.event = event;
    this.quantity = event.quantity;
    this.currency = event.tokenSymbol;
    this.timestamp = event.timeStamp;
    this.protectedAvailableCostBasisQuantity =
      this.getAvailableCostBasisQuantity();
  }

  private buildFromExchangeEvent(event: ExchangeEventDB) {
    this.id = event.id;
    this.event = event;
    this.quantity = new Decimal(event.vol);
    this.currency = event.baseCurrency;
    this.timestamp = event.time;
    this.protectedAvailableCostBasisQuantity =
      this.getAvailableCostBasisQuantity();
  }

  private getAvailableCostBasisQuantity() {
    return (this.event.disposalCostBasis || []).reduce((acc, curr) => {
      return acc.plus(curr.quantity);
    }, this.quantity);
  }

  public spendAvailableCostBasisQuantity(quantity: Decimal) {
    if (
      this.isExhausted ||
      this.protectedAvailableCostBasisQuantity.minus(quantity).lessThan(0)
    ) {
      throw new Error('Acquisition event is exhausted');
    }

    this.protectedAvailableCostBasisQuantity =
      this.protectedAvailableCostBasisQuantity.minus(quantity);
  }
}
