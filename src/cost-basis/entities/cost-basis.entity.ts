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

export enum CostBasisMethod {
  FIFO = 'fifo', // First In, First Out
}

@Entity()
export class CostBasis implements CostBasisDB {
  @PrimaryGeneratedColumn()
  id: number;

  // The acquisition transaction (buying/receiving event)
  @ManyToOne(() => ChainEvent, { nullable: true })
  @JoinColumn({ name: 'acquisitionChainEventId' })
  acquisitionChainEvent: ChainEvent | null;

  @Column({ nullable: true })
  acquisitionChainEventId: number | null;

  @ManyToOne(() => ExchangeEvent, { nullable: true })
  @JoinColumn({ name: 'acquisitionExchangeEventId' })
  acquisitionExchangeEvent: ExchangeEvent | null;

  @Column({ nullable: true })
  acquisitionExchangeEventId: number | null;

  // The disposal transaction (selling/spending event)
  @ManyToOne(() => ChainEvent, { nullable: true })
  @JoinColumn({ name: 'disposalChainEventId' })
  disposalChainEvent: ChainEvent | null;

  @Column({ nullable: true })
  disposalChainEventId: number | null;

  @ManyToOne(() => ExchangeEvent, { nullable: true })
  @JoinColumn({ name: 'disposalExchangeEventId' })
  disposalExchangeEvent: ExchangeEvent | null;

  @Column({ nullable: true })
  disposalExchangeEventId: number | null;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: false })
  quantity: number;

  // Cost basis details
  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: false })
  costBasisUSD: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  proceedsUSD: number | null;

  @Column({
    type: 'enum',
    enum: CostBasisMethod,
    default: CostBasisMethod.FIFO,
    nullable: false,
  })
  method: CostBasisMethod;

  // Track if this is fully or partially matched
  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  remainingQuantity: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
