import { z } from 'zod';
import {
  ExchangeEventDBSchema,
  ExchangeEventSchema,
} from '../dto/exchange-event.schema';

// New type definitions using Zod
export type ExchangeEvent = z.infer<typeof ExchangeEventSchema>;

export type ExchangeEventDB = z.infer<typeof ExchangeEventDBSchema>;

export type PaginatedExchangeResponse<T> = {
  results: T;
  hasNextPage: boolean;
  currentPage: number;
  resultsCount: number;
};
