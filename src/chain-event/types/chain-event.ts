import { z } from 'zod';
import {
  ChainEventDBSchema,
  ChainEventSchema,
} from '../dto/chain-event.schema';
import { CostBasisDB } from '../../cost-basis/types/cost-basis';

export type ChainEvent = z.infer<typeof ChainEventSchema>;

export interface ChainEventDB extends z.infer<typeof ChainEventDBSchema> {
  acquisitionCostBasis?: CostBasisDB[];
  disposalCostBasis?: CostBasisDB[];
}

export interface ChainEventDBWithUSDValue
  extends Pick<ChainEventDB, 'id' | 'tokenSymbol' | 'timeStamp'> {
  usdValue: number;
}

export type ChainEventIdWithCryptoPriceId = Pick<
  ChainEventDB,
  'id' | 'cryptoPriceId'
>;
