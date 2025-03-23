import { z } from 'zod';
import {
  CryptoPriceDBSchema,
  CryptoPriceSchema,
} from '../dto/crypto-price.schema';

export type CryptoPriceDB = z.infer<typeof CryptoPriceDBSchema>;

export type CryptoPrice = z.infer<typeof CryptoPriceSchema>;
