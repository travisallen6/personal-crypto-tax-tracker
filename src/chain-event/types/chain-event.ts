export interface ChainEventTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input?: string;
  confirmations: string;
}

export type ChainEventDB = Omit<
  ChainEventTransaction,
  | 'timeStamp'
  | 'blockNumber'
  | 'nonce'
  | 'tokenDecimal'
  | 'transactionIndex'
  | 'gas'
  | 'confirmations'
  | 'hash'
> & {
  timeStamp: Date;
  blockNumber: number;
  nonce: number;
  tokenDecimal: number;
  transactionIndex: number;
  gas: number;
  confirmations: number;
  transactionHash: string;
  chainEventUniqueId: string;
};
