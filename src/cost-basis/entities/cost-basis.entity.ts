import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChainEvent } from '../../chain-event/entities/chain-event.entity';
import { ExchangeEvent } from '../../exchange-event/entities/exchange-event.entity';
import { CostBasisDB } from '../types/cost-basis';
import { ChainEventDB } from '../../chain-event/types/chain-event';
import { ExchangeEventDB } from '../../exchange-event/types/exchange-event';
import { DisposalEvent } from '../../cost-basis-event/disposal-event';
import { AcquisitionEvent } from '../../cost-basis-event/acquisition-event';

export enum CostBasisMethod {
  FIFO = 'fifo', // First In, First Out
}

@Entity()
export class CostBasis implements CostBasisDB {
  @PrimaryGeneratedColumn()
  id: number;

  // The acquisition transaction (buying/receiving event)
  @ManyToOne(
    () => ChainEvent,
    (chainEvent) => chainEvent.acquisitionCostBasis,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'acquisitionChainEventId' })
  acquisitionChainEvent?: ChainEventDB;

  @Column({ nullable: true })
  acquisitionChainEventId: number | null;

  @ManyToOne(
    () => ExchangeEvent,
    (exchangeEvent) => exchangeEvent.acquisitionCostBasis,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'acquisitionExchangeEventId' })
  acquisitionExchangeEvent?: ExchangeEventDB;

  @Column({ nullable: true })
  acquisitionExchangeEventId: number | null;

  // The disposal transaction (selling/spending event)
  @ManyToOne(() => ChainEvent, (chainEvent) => chainEvent.disposalCostBasis, {
    nullable: true,
  })
  @JoinColumn({ name: 'disposalChainEventId' })
  disposalChainEvent?: ChainEventDB;

  @Column({ nullable: true })
  disposalChainEventId: number | null;

  @ManyToOne(
    () => ExchangeEvent,
    (exchangeEvent) => exchangeEvent.disposalCostBasis,
    { nullable: true },
  )
  @JoinColumn({ name: 'disposalExchangeEventId' })
  disposalExchangeEvent?: ExchangeEventDB;

  @Column({ nullable: true })
  disposalExchangeEventId: number | null;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: false })
  quantity: number;

  @Column({
    type: 'enum',
    enum: CostBasisMethod,
    default: CostBasisMethod.FIFO,
    nullable: false,
  })
  method: CostBasisMethod;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get disposalEvent(): DisposalEvent | null {
    if (this.disposalExchangeEvent) {
      return new DisposalEvent(this.disposalExchangeEvent);
    }

    if (this.disposalChainEvent) {
      return new DisposalEvent(this.disposalChainEvent);
    }

    return null;
  }

  get acquisitionEvent(): AcquisitionEvent | null {
    if (this.acquisitionExchangeEvent) {
      return new AcquisitionEvent(this.acquisitionExchangeEvent);
    }

    if (this.acquisitionChainEvent) {
      return new AcquisitionEvent(this.acquisitionChainEvent);
    }

    return null;
  }
}
