export interface KrakenTradeTransactionRaw {
  ordertxid: string;
  pair: string;
  time: number;
  type: 'buy' | 'sell';
  ordertype: string;
  price: string;
  cost: string;
  fee: string;
  vol: string;
  margin: string;
  misc: string;
  aclass: string;
  leverage: string;
  trade_id: number;
  maker: boolean;
  ledgers?: string[];
  postxid?: string;
  posstatus?: string;
  cprice?: string;
  ccost?: string;
  cfee?: string;
  cvol?: string;
  cmargin?: string;
  net?: string;
  trades?: string[];
}

export interface KrakenTradeTransaction
  extends Omit<
    KrakenTradeTransactionRaw,
    'time' | 'price' | 'cost' | 'fee' | 'vol' | 'margin' | 'leverage'
  > {
  txid: string;
  time: Date;
  price: number;
  cost: number;
  fee: number;
  vol: number;
  margin: number;
  leverage: number;
}

export interface PaginatedExchangeResponse<T> {
  currentPage: number;
  hasNextPage: boolean;
  result: T;
}
