import { z } from 'zod';

export const CryptoPriceSchema = z.object({
  timestamp: z.date(),
  rangeStartTimestamp: z.date(),
  rangeEndTimestamp: z.date(),
  price: z.number(),
  symbol: z.string().max(10),
});

export const CryptoPriceDBSchema = CryptoPriceSchema.extend({
  id: z.number(),
});
