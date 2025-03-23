import { PartialType } from '@nestjs/mapped-types';
import { CreateCryptoPriceDTO } from './create-crypto-price.dto';

export class UpdateCryptoPriceDTO extends PartialType(CreateCryptoPriceDTO) {}
