import { z } from 'zod';

// Define reusable validators
const TransactionIdSchema = z.string().max(100);
const DecimalSchema = z.number().or(
  z
    .string()
    .regex(/^-?\d+(\.\d+)?$/)
    .transform(Number),
);
const OptionalStringSchema = z.string().max(100).optional();
const OptionalStringArraySchema = z.array(z.string()).optional();

// Main schema for use with database entities (includes ID)
export const ExchangeEventDBSchema = z.object({
  id: z.number().int().positive(),
  txid: TransactionIdSchema,
  pair: z.string().max(20),
  time: z.date(),
  type: z.enum(['buy', 'sell']),
  ordertype: z.string().max(20),
  price: DecimalSchema,
  cost: DecimalSchema,
  fee: DecimalSchema,
  vol: DecimalSchema,
  margin: DecimalSchema,
  leverage: DecimalSchema,
  maker: z.boolean(),
  trade_id: z.number().int(),
  ordertxid: TransactionIdSchema,
  misc: z.string().max(100),
  aclass: z.string().max(50),
  ledgers: OptionalStringArraySchema,
  postxid: OptionalStringSchema,
  posstatus: OptionalStringSchema,
  cprice: OptionalStringSchema,
  ccost: OptionalStringSchema,
  cfee: OptionalStringSchema,
  cvol: OptionalStringSchema,
  cmargin: OptionalStringSchema,
  net: OptionalStringSchema,
  trades: OptionalStringArraySchema,
});

// Schema without ID for creating new records
export const ExchangeEventSchema = ExchangeEventDBSchema.omit({ id: true });

// Schema for paginated response
export const PaginatedExchangeResponseSchema = z.object({
  results: z.array(ExchangeEventDBSchema),
  hasNextPage: z.boolean(),
  currentPage: z.number().int().nonnegative(),
  resultsCount: z.number().int().nonnegative(),
});
