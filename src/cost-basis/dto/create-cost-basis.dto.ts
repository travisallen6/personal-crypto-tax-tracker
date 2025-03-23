import { createZodDto } from 'nestjs-zod';
import { CostBasisSchema } from './cost-basis.schema';

export class CreateCostBasisDto extends createZodDto(CostBasisSchema) {}
