import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ExchangeEvent as ExchangeEventDB } from '../types/exchange-event';

@Entity()
export class ExchangeEvent implements ExchangeEventDB {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'varchar', length: 20, nullable: false })
  ordertype: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: false })
  price: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: false })
  cost: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: false })
  fee: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: false })
  vol: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: false })
  margin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  leverage: number;

  @Column({ type: 'boolean', nullable: false })
  maker: boolean;

  @Column({ type: 'integer', nullable: false })
  trade_id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  ordertxid: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  misc: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  aclass: string;

  @Column({ type: 'simple-array', nullable: true })
  ledgers?: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  postxid?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  posstatus?: string;

  @Column({ type: 'simple-array', nullable: true })
  trades?: string[];
}
