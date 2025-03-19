import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  Optional,
  Logger,
} from '@nestjs/common';
import { KrakenService } from './kraken.service';

@Controller('exchange-event')
export class ExchangeEventController {
  private readonly logger = new Logger(ExchangeEventController.name);

  constructor(private readonly krakenService: KrakenService) {}

  /**
   * Get all closed trades from Kraken
   * @param start Optional UNIX timestamp to start from
   * @param end Optional UNIX timestamp to end at
   * @param offset Optional result offset for pagination
   * @returns Record of trade transactions
   */
  @Get('kraken/trades')
  async getClosedTrades(
    @Query('start', new ParseIntPipe({ optional: true }))
    @Optional()
    start?: number,
    @Query('end', new ParseIntPipe({ optional: true }))
    @Optional()
    end?: number,
    @Query('offset', new ParseIntPipe({ optional: true }))
    @Optional()
    offset?: number,
  ): ReturnType<typeof this.krakenService.getClosedTrades> {
    this.logger.log(
      `Fetching closed trades from Kraken with params: start=${start}, end=${end}, offset=${offset}`,
    );

    return this.krakenService.getClosedTrades(start, end, offset);
  }

  /**
   * Get only sell trades from Kraken
   * @param start Optional UNIX timestamp to start from
   * @param end Optional UNIX timestamp to end at
   * @returns Array of sell trade transactions
   */
  @Get('kraken/sell-trades')
  async getSellTrades(
    @Query('start', new ParseIntPipe({ optional: true }))
    @Optional()
    start?: number,
    @Query('end', new ParseIntPipe({ optional: true }))
    @Optional()
    end?: number,
  ): ReturnType<typeof this.krakenService.getSellTrades> {
    this.logger.log(
      `Fetching sell trades from Kraken with params: start=${start}, end=${end}`,
    );
    return this.krakenService.getSellTrades(start, end);
  }
}
