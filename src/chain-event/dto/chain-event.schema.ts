import { Decimal } from 'decimal.js';
import { z } from 'zod';

const EthereumAddressSchema = z
  .string()
  .length(42)
  .regex(/^0x[a-fA-F0-9]{40}$/);

const EthereumTransactionHashSchema = z
  .string()
  .length(66)
  .regex(/^0x[a-fA-F0-9]{64}$/);

const StringifiedNumberSchema = z.string().regex(/^[0-9]+$/);

export const ChainEventSchema = z.object({
  blockNumber: z.number().int().positive(),
  timeStamp: z.date(),
  transactionHash: EthereumTransactionHashSchema,
  nonce: z.number().int().nonnegative(),
  blockHash: EthereumTransactionHashSchema,
  from: EthereumAddressSchema,
  contractAddress: EthereumAddressSchema,
  to: EthereumAddressSchema,
  value: StringifiedNumberSchema,
  tokenName: z.string().max(100),
  tokenSymbol: z.string().max(100),
  tokenDecimal: z.number().int().min(0).max(32767), // smallint in PostgreSQL
  transactionIndex: z.number().int().nonnegative().max(32767), // smallint in PostgreSQL
  gas: z.number().int().positive(),
  gasPrice: StringifiedNumberSchema,
  gasUsed: StringifiedNumberSchema,
  cumulativeGasUsed: StringifiedNumberSchema,
  confirmations: z.number().int().nonnegative(),
  cryptoPriceId: z.number().int().positive().optional(),
});

export const ChainEventDBSchema = ChainEventSchema.extend({
  id: z.number().int().positive(),
  quantity: z.instanceof(Decimal),
});
