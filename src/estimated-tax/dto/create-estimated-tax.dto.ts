import { z } from 'zod';

export const createEstimatedTaxSchema = z.object({
  agency: z.string().min(1),
  amount: z.number().positive(),
  date: z.date(),
  confirmation: z.string().optional(),
  pdfConfirmation: z.instanceof(Buffer).optional(),
});

export type CreateEstimatedTaxDto = z.infer<typeof createEstimatedTaxSchema>;
