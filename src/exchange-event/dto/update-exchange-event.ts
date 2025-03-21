import { PartialType } from '@nestjs/mapped-types';
import { CreateExchangeEventDto } from './create-exchange-event';

export class UpdateExchangeEventDto extends PartialType(
  CreateExchangeEventDto,
) {}
