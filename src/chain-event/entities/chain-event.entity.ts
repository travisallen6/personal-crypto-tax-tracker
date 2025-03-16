import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ChainEventDB } from '../types/chain-event';

@Entity()
export class ChainEvent implements ChainEventDB {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: false })
  blockNumber: number;

  @Column({ type: 'timestamptz', nullable: false })
  timeStamp: Date;

  @Column({ type: 'varchar', length: 66, nullable: false })
  hash: string;

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
}
