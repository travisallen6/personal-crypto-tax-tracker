import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { ExchangeEvent as ExchangeEventDB } from '../types/exchange-event';
import { CostBasis } from '../../cost-basis/entities/cost-basis.entity';

@Entity()
export class ExchangeEvent implements ExchangeEventDB {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  exchange: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: false })
  txid: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  pair: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  baseCurrency: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  quoteCurrency: string;

  @Column({ type: 'timestamptz', nullable: false })
  time: Date;

  @Column({ type: 'enum', enum: ['buy', 'sell'], nullable: false })
  type: 'buy' | 'sell';

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: false })
  price: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: false })
  cost: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 8,
    nullable: false,
  })
  baseFee: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 8,
    nullable: false,
  })
  quoteFee: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 8,
    nullable: false,
  })
  withdrawalFee: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: false })
  vol: number;

  @Column({ type: 'simple-array', nullable: true })
  ledgers?: string[];

  // Add OneToMany relations for costBasis
  @OneToMany(() => CostBasis, (costBasis) => costBasis.acquisitionExchangeEvent)
  acquisitionCostBasis: CostBasis[];

  @OneToMany(() => CostBasis, (costBasis) => costBasis.disposalExchangeEvent)
  disposalCostBasis: CostBasis[];
}
