import { z } from 'zod';
import { CostBasisMethod } from '../entities/cost-basis.entity';
import { TaxClassificationType } from '../../tax-classification/types/tax-classification';
import { IncomeType } from '../../tax-classification/types/income-type';

export const CostBasisSchema = z.object({
  // Acquisition fields
  acquisitionChainEventId: z.number().nullable(),
  acquisitionExchangeEventId: z.number().nullable(),

  // Disposal fields
  disposalChainEventId: z.number().nullable(),
  disposalExchangeEventId: z.number().nullable(),

  // Quantity and financial details
  quantity: z.number().positive(),

  // Method and status
  method: z.nativeEnum(CostBasisMethod),

  // Tax classification
  taxClassificationType: z.nativeEnum(TaxClassificationType).nullable(),
  incomeType: z.nativeEnum(IncomeType).nullable(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CostBasisDBSchema = CostBasisSchema.extend({
  id: z.number(),
});
