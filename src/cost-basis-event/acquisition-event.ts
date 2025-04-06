import { ChainEventDB } from '../chain-event/types/chain-event';
import { CostBasis } from '../cost-basis/entities/cost-basis.entity';
import { ExchangeEventDB } from '../exchange-event/types/exchange-event';
import { Decimal } from 'decimal.js';
import { DisposalEvent } from './disposal-event';

export class AcquisitionEvent {
  public id: number;
  public quantity: Decimal;
  public currency: string;
  private protectedAvailableCostBasisQuantity: Decimal;
  private baseFee: Decimal;
  private quoteFee: Decimal;
  private withdrawalFee: Decimal;
  public timestamp: Date;
  public disposalEvents: DisposalEvent[];
  public isIncomeEvent: boolean;
  private priceAtEvent: Decimal;

  constructor(private event: ChainEventDB | ExchangeEventDB) {
    if (this.isChainEvent(event)) {
      this.buildFromChainEvent(event);
    } else if (this.isExchangeEvent(event)) {
      this.buildFromExchangeEvent(event);
    }
    this.buildDisposalEvents();
  }

  get availableCostBasisQuantity() {
    return this.protectedAvailableCostBasisQuantity;
  }

  get sourceId(): string {
    return this.isChainEvent(this.event)
      ? `chain_event:${this.event.id}`
      : `exchange_event:${this.event.id}`;
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

  get usdValue(): Decimal {
    return this.priceAtEvent.mul(this.quantity);
  }

  private buildFromChainEvent(event: ChainEventDB) {
    this.id = event.id;
    this.event = event;
    this.quantity = event.quantity;
    this.currency = event.tokenSymbol;
    this.baseFee = new Decimal(0);
    this.quoteFee = new Decimal(0);
    this.withdrawalFee = new Decimal(0);
    this.priceAtEvent = event.cryptoPrice?.price
      ? new Decimal(event.cryptoPrice.price)
      : new Decimal(0);
    this.timestamp = event.timeStamp;
    this.isIncomeEvent = true;
    this.protectedAvailableCostBasisQuantity =
      this.getAvailableCostBasisQuantity();
  }

  private buildFromExchangeEvent(event: ExchangeEventDB) {
    this.id = event.id;
    this.event = event;
    this.currency = event.quoteCurrency;
    this.baseFee = new Decimal(event.baseFee);
    this.quoteFee = new Decimal(event.quoteFee);
    this.withdrawalFee = new Decimal(event.withdrawalFee);
    this.priceAtEvent = new Decimal(event.price);
    this.quantity = new Decimal(event.vol)
      .minus(this.quoteFee)
      .minus(this.withdrawalFee);
    this.timestamp = event.time;
    this.isIncomeEvent = false;
    this.protectedAvailableCostBasisQuantity =
      this.getAvailableCostBasisQuantity();
  }

  private buildDisposalEvents() {
    this.disposalEvents = (this.event.acquisitionCostBasis || [])
      .filter(
        (costBasis) =>
          costBasis.disposalChainEvent || costBasis.disposalExchangeEvent,
      )
      .map((costBasis) => {
        if (costBasis.disposalChainEvent) {
          return new DisposalEvent(costBasis.disposalChainEvent);
        }

        return new DisposalEvent(
          costBasis.disposalExchangeEvent as ExchangeEventDB,
        );
      });
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
