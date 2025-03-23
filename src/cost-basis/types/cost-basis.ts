import { z } from 'zod';
import { CostBasisDBSchema, CostBasisSchema } from '../dto/cost-basis.schema';

export type CostBasis = z.infer<typeof CostBasisSchema>;

export type CostBasisDB = z.infer<typeof CostBasisDBSchema>;
