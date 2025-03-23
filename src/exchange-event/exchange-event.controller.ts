import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { ExchangeEventService } from './exchange-event.service';
import { CreateExchangeEventDto } from './dto/create-exchange-event';
import { UpdateExchangeEventDto } from './dto/update-exchange-event';
import { ExchangeEventSyncService } from './exchange-event-sync.service';

@Controller('exchange-event')
export class ExchangeEventController {
  private readonly logger = new Logger(ExchangeEventController.name);

  constructor(
    private readonly exchangeEventService: ExchangeEventService,
    private readonly exchangeEventSyncService: ExchangeEventSyncService,
  ) {}

  /**
   * Create a new exchange event
   * @param createExchangeEventDto Exchange event data
   * @returns Created exchange event
   */
  @Post()
  create(@Body() createExchangeEventDto: CreateExchangeEventDto) {
    this.logger.log('Creating new exchange event');
    return this.exchangeEventService.create(createExchangeEventDto);
  }

  /**
   * Create multiple exchange events
   * @param createExchangeEventDtos Array of exchange event data
   * @returns Created exchange events
   */
  @Post('bulk')
  createMany(@Body() createExchangeEventDtos: CreateExchangeEventDto[]) {
    this.logger.log(
      `Creating ${createExchangeEventDtos.length} exchange events`,
    );
    return this.exchangeEventService.createMany(createExchangeEventDtos);
  }

  /**
   * Get all exchange events
   * @returns Array of all exchange events
   */
  @Get()
  findAll() {
    this.logger.log('Fetching all exchange events');
    return this.exchangeEventService.findAll();
  }

  /**
   * Get a specific exchange event by ID
   * @param id Exchange event ID
   * @returns Exchange event with the specified ID
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching exchange event with id: ${id}`);
    return this.exchangeEventService.findOne(id);
  }

  /**
   * Update an exchange event
   * @param id Exchange event ID
   * @param updateExchangeEventDto Updated exchange event data
   * @returns Result of the update operation
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExchangeEventDto: UpdateExchangeEventDto,
  ) {
    this.logger.log(`Updating exchange event with id: ${id}`);
    return this.exchangeEventService.update(id, updateExchangeEventDto);
  }

  /**
   * Delete an exchange event
   * @param id Exchange event ID
   * @returns Result of the delete operation
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Removing exchange event with id: ${id}`);
    return this.exchangeEventService.remove(id);
  }

  /**
   * Sync exchange events from the exchange API
   * @returns Result of the sync operation
   */
  @Post('sync')
  async syncExchangeEvents() {
    this.logger.log('Syncing exchange events');
    await this.exchangeEventSyncService.syncExchangeEvents();
    return { success: true, message: 'Exchange events sync completed' };
  }
}
