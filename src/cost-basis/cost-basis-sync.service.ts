import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostBasis } from './entities/cost-basis.entity';
import { ExchangeEventService } from '../exchange-event/exchange-event.service';
import { ChainEventService } from '../chain-event/chain-event.service';
import { CostBasisService } from './cost-basis.service';

@Injectable()
export class CostBasisSyncService {
  private readonly logger = new Logger(CostBasisSyncService.name);

  constructor(
    @InjectRepository(CostBasis)
    private readonly costBasisRepository: Repository<CostBasis>,
    private readonly costBasisService: CostBasisService,
    private readonly exchangeEventService: ExchangeEventService,
    private readonly chainEventService: ChainEventService,
  ) {}
}
