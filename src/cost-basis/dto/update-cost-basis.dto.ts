import { PartialType } from '@nestjs/mapped-types';
import { CreateCostBasisDto } from './create-cost-basis.dto';

export class UpdateCostBasisDto extends PartialType(CreateCostBasisDto) {}
