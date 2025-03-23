import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { CryptoPriceDB } from '../types/crypo-price';
import { ChainEvent } from '../../chain-event/entities/chain-event.entity';
@Entity()
export class CryptoPrice implements CryptoPriceDB {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'timestamptz', nullable: false })
  rangeStartTimestamp: Date;

  @Index({ unique: true })
  @Column({ type: 'timestamptz', nullable: false })
  rangeEndTimestamp: Date;

  @Column({ type: 'timestamptz', nullable: false })
  timestamp: Date;

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: false })
  price: number;

  @Column({ type: 'varchar', length: 10, nullable: false })
  symbol: string;

  @OneToMany(() => ChainEvent, (chainEvent) => chainEvent.cryptoPrice)
  chainEvents: ChainEvent[];
}
