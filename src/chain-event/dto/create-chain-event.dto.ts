import { createZodDto } from 'nestjs-zod';
import { ChainEventSchema } from './chain-event.schema';

export class CreateChainEventDto extends createZodDto(ChainEventSchema) {}
