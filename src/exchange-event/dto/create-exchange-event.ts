import { createZodDto } from 'nestjs-zod';
import { ExchangeEventSchema } from './exchange-event.schema';

export class CreateExchangeEventDto extends createZodDto(ExchangeEventSchema) {}
