import { ChainEventDB } from '../chain-event/types/chain-event';
import { ExchangeEventDB } from '../exchange-event/types/exchange-event';
import { Decimal } from 'decimal.js';
import { AcquisitionEvent } from './acquisition-event';
import {
  CostBasis,
  CostBasisMethod,
} from '../cost-basis/entities/cost-basis.entity';
import { CreateCostBasisDto } from '../cost-basis/dto/create-cost-basis.dto';

interface CostBasisLinkResult {
  newCostBasisRecord: CreateCostBasisDto;
  isAcquisitionEventExhausted: boolean;
  isDisposalEventExhausted: boolean;
}

export class DisposalEvent {
  public id: number;
  public quantity: Decimal;
  public baseFee: Decimal;
  public quoteFee: Decimal;
  public currency: string;
  private protectedUnaccountedCostBasisQuantity: Decimal;
  public timestamp: Date;

  constructor(private event: ChainEventDB | ExchangeEventDB) {
    if (this.isChainEvent(event)) {
      this.buildFromChainEvent(event);
    } else if (this.isExchangeEvent(event)) {
      this.buildFromExchangeEvent(event);
    }
  }

  get unaccountedCostBasisQuantity() {
    return this.protectedUnaccountedCostBasisQuantity;
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

  private buildFromChainEvent(event: ChainEventDB) {
    this.id = event.id;
    this.event = event;
    this.quantity = event.quantity;
    this.currency = event.tokenSymbol;
    this.timestamp = event.timeStamp;
    this.baseFee = new Decimal(0);
    this.quoteFee = new Decimal(0);
    this.protectedUnaccountedCostBasisQuantity =
      this.getUnaccountedCostBasisQuantity();
  }

  private buildFromExchangeEvent(event: ExchangeEventDB) {
    this.id = event.id;
    this.event = event;
    this.quantity = new Decimal(event.vol);
    this.currency = event.baseCurrency;
    this.timestamp = event.time;
    this.baseFee = new Decimal(event.baseFee);
    this.quoteFee = new Decimal(event.quoteFee);
    this.protectedUnaccountedCostBasisQuantity =
      this.getUnaccountedCostBasisQuantity();
  }

  private getUnaccountedCostBasisQuantity() {
    return (this.event.acquisitionCostBasis || []).reduce((acc, curr) => {
      return acc.plus(curr.quantity);
    }, this.quantity.add(this.baseFee));
  }

  private get disposalIdProperty(): keyof CostBasis {
    return this.isChainEvent(this.event)
      ? 'disposalChainEventId'
      : 'disposalExchangeEventId';
  }

  get isExhausted(): boolean {
    return this.protectedUnaccountedCostBasisQuantity.lessThanOrEqualTo(0);
  }

  private generateNewCostBasisRecord(
    costBasisQuantity: Decimal,
    acquisitionEvent: AcquisitionEvent,
  ): CreateCostBasisDto {
    const computedCostBasisIds = {
      [acquisitionEvent.acquisitionIdProperty]: acquisitionEvent.id,
      [this.disposalIdProperty]: this.event.id,
    };

    return {
      quantity: costBasisQuantity.toNumber(),
      method: CostBasisMethod.FIFO,
      acquisitionChainEventId: null,
      acquisitionExchangeEventId: null,
      disposalChainEventId: null,
      disposalExchangeEventId: null,
      ...computedCostBasisIds,
    };
  }

  private validateCanLinkWithAcquisitionEvent(
    acquisitionEvent: AcquisitionEvent,
  ) {
    if (this.isExhausted) {
      throw new Error('Disposal event is exhausted');
    }

    if (acquisitionEvent.isExhausted) {
      throw new Error('Acquisition event is exhausted');
    }

    if (acquisitionEvent.currency !== this.currency) {
      throw new Error(
        'Acquisition event currency does not match disposal event currency',
      );
    }

    if (this.timestamp <= acquisitionEvent.timestamp) {
      throw new Error(
        'Acquisition event timestamp cannot be greater or equal to the disposal event timestamp',
      );
    }
  }

  public linkWithCostAcquisitionEvent(
    acquisitionEvent: AcquisitionEvent,
  ): CostBasisLinkResult {
    this.validateCanLinkWithAcquisitionEvent(acquisitionEvent);
    const quantityToUse = Decimal.min(
      this.protectedUnaccountedCostBasisQuantity,
      acquisitionEvent.availableCostBasisQuantity,
    );

    this.protectedUnaccountedCostBasisQuantity =
      this.protectedUnaccountedCostBasisQuantity.minus(quantityToUse);

    acquisitionEvent.spendAvailableCostBasisQuantity(quantityToUse);

    return {
      newCostBasisRecord: this.generateNewCostBasisRecord(
        quantityToUse,
        acquisitionEvent,
      ),
      isAcquisitionEventExhausted: acquisitionEvent.isExhausted,
      isDisposalEventExhausted: this.isExhausted,
    };
  }
}
