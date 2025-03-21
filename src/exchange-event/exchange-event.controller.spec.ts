import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeEventController } from './exchange-event.controller';
import { KrakenService } from './kraken.service';
import { ExchangeEvent } from './types/exchange-event';
describe('ExchangeEventController', () => {
  let controller: ExchangeEventController;

  const mockKrakenService = {
    getClosedTrades: jest.fn(),
    getSellTrades: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExchangeEventController],
      providers: [
        {
          provide: KrakenService,
          useValue: mockKrakenService,
        },
      ],
    }).compile();

    controller = module.get<ExchangeEventController>(ExchangeEventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getClosedTrades', () => {
    it('should return all closed trades from Kraken service', async () => {
      const mockTrades: ExchangeEvent[] = [
        {
          txid: 'TXID1',
          aclass: 'forex',
          leverage: 0,
          trade_id: 0,
          maker: false,
          ordertxid: 'OTXID1',
          pair: 'XBTEUR',
          time: new Date(1609459200),
          type: 'sell',
          ordertype: 'market',
          price: 30000.0,
          cost: 300.0,
          fee: 0.6,
          vol: 0.01,
          margin: 0,
          misc: '',
        },
        {
          txid: 'TXID2',
          aclass: 'forex',
          leverage: 0,
          trade_id: 0,
          maker: false,
          ordertxid: 'OTXID2',
          pair: 'ETHEUR',
          time: new Date(1609459300),
          type: 'buy',
          ordertype: 'limit',
          price: 1000.0,
          cost: 100.0,
          fee: 0.2,
          vol: 0.1,
          margin: 0,
          misc: '',
        },
      ];

      mockKrakenService.getClosedTrades.mockResolvedValue(mockTrades);

      const result = await controller.getClosedTrades();

      expect(result).toEqual(mockTrades);
      expect(mockKrakenService.getClosedTrades).toHaveBeenCalled();
    });

    it('should pass parameters to Kraken service', async () => {
      const start = 1609459000;
      const end = 1609460000;
      const offset = 10;

      mockKrakenService.getClosedTrades.mockResolvedValue({});

      await controller.getClosedTrades(start, end, offset);

      expect(mockKrakenService.getClosedTrades).toHaveBeenCalledWith(
        start,
        end,
        offset,
      );
    });
  });

  describe('getSellTrades', () => {
    it('should return only sell trades from Kraken service', async () => {
      const mockSellTrades: ExchangeEvent[] = [
        {
          txid: 'TXID1',
          aclass: 'forex',
          leverage: 0,
          trade_id: 0,
          maker: false,
          ordertxid: 'OTXID1',
          pair: 'XBTEUR',
          time: new Date(1609459200),
          type: 'sell',
          ordertype: 'market',
          price: 30000.0,
          cost: 300.0,
          fee: 0.6,
          vol: 0.01,
          margin: 0,
          misc: '',
        },
        {
          txid: 'TXID2',
          aclass: 'forex',
          leverage: 0,
          trade_id: 0,
          maker: false,
          ordertxid: 'OTXID3',
          pair: 'XBTEUR',
          time: new Date(1609459400),
          type: 'sell',
          ordertype: 'market',
          price: 31000.0,
          cost: 310.0,
          fee: 0.62,
          vol: 0.01,
          margin: 0,
          misc: '',
        },
      ];

      mockKrakenService.getSellTrades.mockResolvedValue(mockSellTrades);

      const result = await controller.getSellTrades();

      expect(result).toEqual(mockSellTrades);
      expect(mockKrakenService.getSellTrades).toHaveBeenCalled();
    });

    it('should pass parameters to Kraken service', async () => {
      const start = 1609459000;
      const end = 1609460000;

      mockKrakenService.getSellTrades.mockResolvedValue([]);

      await controller.getSellTrades(start, end);

      expect(mockKrakenService.getSellTrades).toHaveBeenCalledWith(start, end);
    });
  });
});
