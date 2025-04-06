import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('estimated_tax_payments')
export class EstimatedTax {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  agency: string;

  @Column('decimal', { precision: 19, scale: 8 })
  amount: number;

  @Column()
  date: Date;

  @Column({ nullable: true })
  confirmation: string;

  @Column('bytea', { nullable: true })
  pdfConfirmation: Buffer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
