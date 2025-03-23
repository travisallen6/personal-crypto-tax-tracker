import { z } from 'zod';
import {
  ChainEventDBSchema,
  ChainEventSchema,
} from '../dto/chain-event.schema';

export type ChainEvent = z.infer<typeof ChainEventSchema>;

export type ChainEventDB = z.infer<typeof ChainEventDBSchema>;

export type ChainEventIdWithCryptoPriceId = Pick<
  ChainEventDB,
  'id' | 'cryptoPriceId'
>;
