import { PartialType } from '@nestjs/mapped-types';
import { CreateChainEventDto } from './create-chain-event.dto';

export class UpdateChainEventDto extends PartialType(CreateChainEventDto) {}
