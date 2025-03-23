import { createZodDto } from 'nestjs-zod';
import { CryptoPriceSchema } from './crypto-price.schema';

export class CreateCryptoPriceDTO extends createZodDto(CryptoPriceSchema) {}
