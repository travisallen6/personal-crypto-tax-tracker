import { z } from 'zod';
import { CostBasisDBSchema, CostBasisSchema } from '../dto/cost-basis.schema';
import { ChainEventDB } from '../../chain-event/types/chain-event';
import { ExchangeEventDB } from '../../exchange-event/types/exchange-event';

export type CostBasis = z.infer<typeof CostBasisSchema>;

export interface CostBasisDB extends z.infer<typeof CostBasisDBSchema> {
  acquisitionChainEvent?: ChainEventDB;
  disposalChainEvent?: ChainEventDB;
  acquisitionExchangeEvent?: ExchangeEventDB;
  disposalExchangeEvent?: ExchangeEventDB;
}
