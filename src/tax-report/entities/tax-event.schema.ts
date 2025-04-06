import { z } from 'zod';
import { TaxClassificationType } from '../../tax-classification/types/tax-classification';

export const TaxEventSchema = z.object({
  classification: z.nativeEnum(TaxClassificationType),
  amount: z.number(),
  costBasisId: z.number(),
  costBasisAmount: z.number(),
  proceedsAmount: z.number(),
  gainOrLoss: z.number(),
  isLongTerm: z.boolean().nullable(),
  taxYear: z.number(),
  disposalTimestamp: z.date(),
  acquisitionTimestamp: z.date(),
});

export const IncomeTaxReportAggregateSchema = z.object({
  amountTotal: z.number(),
  proceedsTotal: z.number(),
  events: z.array(TaxEventSchema),
});

export const CapitalGainsTaxReportTotalsSchema = z.object({
  amountTotal: z.number(),
  gainOrLossTotal: z.number(),
  proceedsTotal: z.number(),
  costBasisTotal: z.number(),
});

export const CapitalGainsTaxReportAggregateSchema = z.object({
  totals: CapitalGainsTaxReportTotalsSchema,
  shortTerm: CapitalGainsTaxReportTotalsSchema,
  longTerm: CapitalGainsTaxReportTotalsSchema,
  events: z.array(TaxEventSchema),
});

export type TaxEvent = z.infer<typeof TaxEventSchema>;

export type CapitalGainsTaxReportTotals = z.infer<
  typeof CapitalGainsTaxReportTotalsSchema
>;

export type IncomeTaxReportAggregate = z.infer<
  typeof IncomeTaxReportAggregateSchema
>;

export type CapitalGainsTaxReportAggregate = z.infer<
  typeof CapitalGainsTaxReportAggregateSchema
>;
