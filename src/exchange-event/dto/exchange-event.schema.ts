import { z } from 'zod';

// Define reusable validators
const TransactionIdSchema = z.string().max(100);
const DecimalSchema = z.number().or(
  z
    .string()
    .regex(/^-?\d+(\.\d+)?$/)
    .transform(Number),
);
const OptionalStringArraySchema = z.array(z.string()).optional();

// Main schema for use with database entities (includes ID)
export const ExchangeEventSchema = z.object({
  txid: TransactionIdSchema,
  pair: z.string().max(20),
  baseCurrency: z.string().max(20),
  quoteCurrency: z.string().max(20),
  time: z.date(),
  type: z.enum(['buy', 'sell']),
  price: DecimalSchema,
  cost: DecimalSchema,
  baseFee: DecimalSchema,
  quoteFee: DecimalSchema,
  withdrawalFee: DecimalSchema,
  vol: DecimalSchema,
  ledgers: OptionalStringArraySchema,
});

// Schema without ID for creating new records
export const ExchangeEventDBSchema = ExchangeEventSchema.extend({
  id: z.number().int().positive(),
});

// Schema for paginated response
export const PaginatedExchangeResponseSchema = z.object({
  results: z.array(ExchangeEventDBSchema),
  hasNextPage: z.boolean(),
  currentPage: z.number().int().nonnegative(),
  resultsCount: z.number().int().nonnegative(),
});
