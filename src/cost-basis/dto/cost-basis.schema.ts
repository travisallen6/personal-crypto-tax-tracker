import { z } from 'zod';
import { CostBasisMethod } from '../entities/cost-basis.entity';

export const CostBasisSchema = z.object({
  // Acquisition fields
  acquisitionChainEventId: z.number().nullable(),
  acquisitionExchangeEventId: z.number().nullable(),

  // Disposal fields
  disposalChainEventId: z.number().nullable(),
  disposalExchangeEventId: z.number().nullable(),

  // Quantity and financial details
  quantity: z.number().positive(),
  costBasisUSD: z.number().nonnegative(),
  proceedsUSD: z.number().nullable(),

  // Method and status
  method: z.nativeEnum(CostBasisMethod),
  remainingQuantity: z.number().nullable(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CostBasisDBSchema = CostBasisSchema.extend({
  id: z.number(),
});
