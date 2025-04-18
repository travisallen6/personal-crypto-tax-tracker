import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ChainEventDB } from '../types/chain-event';
import { CryptoPrice } from '../../crypto-price/entities/crypto-price.entity';
import { CostBasis } from '../../cost-basis/entities/cost-basis.entity';
import { CostBasisDB } from '../../cost-basis/types/cost-basis';
import { Decimal } from 'decimal.js';

@Entity()
@Index(
  'chain_event_unique_id',
  ['transactionHash', 'from', 'to', 'contractAddress'],
  {
    unique: true,
  },
)
export class ChainEvent implements ChainEventDB {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: false })
  blockNumber: number;

  @Column({ type: 'timestamptz', nullable: false })
  timeStamp: Date;

  @Column({ type: 'varchar', length: 66, nullable: false })
  transactionHash: string;

  @Column({ type: 'bigint', nullable: false })
  nonce: number;

  @Column({ type: 'varchar', length: 66, nullable: false })
  blockHash: string;

  @Column({ type: 'varchar', length: 42, nullable: false })
  from: string;

  @Column({ type: 'varchar', length: 42, nullable: false })
  contractAddress: string;

  @Column({ type: 'varchar', length: 42, nullable: false })
  to: string;

  @Column({ type: 'text', nullable: false })
  value: string;

  @Column({ type: 'text', nullable: false, default: '0' })
  valueAdjustment: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  tokenName: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  tokenSymbol: string;

  @Column({ type: 'smallint', nullable: false })
  tokenDecimal: number;

  @Column({ type: 'smallint', nullable: false })
  transactionIndex: number;

  @Column({ type: 'bigint', nullable: false })
  gas: number;

  @Column({ type: 'text', nullable: false })
  gasPrice: string;

  @Column({ type: 'text', nullable: false })
  gasUsed: string;

  @Column({ type: 'text', nullable: false })
  cumulativeGasUsed: string;

  @Column({ type: 'bigint', nullable: false })
  confirmations: number;

  @ManyToOne(() => CryptoPrice, (cryptoPrice) => cryptoPrice.id)
  @JoinColumn({ name: 'cryptoPriceId' })
  cryptoPrice: CryptoPrice;

  @OneToMany(() => CostBasis, (costBasis) => costBasis.acquisitionChainEvent)
  acquisitionCostBasis: CostBasisDB[];

  @OneToMany(() => CostBasis, (costBasis) => costBasis.disposalChainEvent)
  disposalCostBasis: CostBasisDB[];

  get quantity(): Decimal {
    return new Decimal(this.value)
      .add(this.valueAdjustment)
      .div(new Decimal(10).pow(this.tokenDecimal));
  }
}
