import { z } from 'zod';
import {
  ExchangeEventDBSchema,
  ExchangeEventSchema,
} from '../dto/exchange-event.schema';
import { CostBasisDB } from '../../cost-basis/types/cost-basis';

// New type definitions using Zod
export type ExchangeEvent = z.infer<typeof ExchangeEventSchema>;

export interface ExchangeEventDB extends z.infer<typeof ExchangeEventDBSchema> {
  disposalCostBasis?: CostBasisDB[];
  acquisitionCostBasis?: CostBasisDB[];
}

export type PaginatedExchangeResponse<T> = {
  results: T;
  totalResultsCount: number;
  currentOffset: number;
};
