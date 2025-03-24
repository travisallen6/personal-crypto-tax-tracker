interface ReadEnvVariableOptions {
  required?: boolean;
  default?: string;
}

export interface DBConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  autoSync: boolean;
}

export interface EtherscanConfig {
  apiKey: string;
  baseUrl: string;
}

export interface KrakenConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  pairToBaseQuoteCurrencyMap: Map<
    string,
    { baseCurrency: string; quoteCurrency: string }
  >;
}

export interface CoinGeckoConfig {
  timestampRangeInterval: number;
  coinIdMap: Record<string, string>;
  apiKey: string;
}

export interface ChainEventConfig {
  earliestBlockNumber: number;
  allowedTokenSymbols: string[];
}

class Config {
  private defaultReadEnvOptions: ReadEnvVariableOptions = {
    required: false,
  };

  protected readEnvVariable(
    key: string,
    options: ReadEnvVariableOptions = {},
  ): string {
    const opts = Object.assign(this.defaultReadEnvOptions, options);
    const value = process.env[key] || '';

    if (opts.required && !value) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }

    if (opts.default && !value) {
      return opts.default;
    }

    return value;
  }

  protected nodeEnv = this.readEnvVariable('NODE_ENV', { required: true });

  public readonly db: DBConfig = {
    host: this.readEnvVariable('DB_HOST', { required: true }),
    port: parseInt(this.readEnvVariable('DB_PORT', { required: true }), 10),
    username: this.readEnvVariable('DB_USERNAME', { required: true }),
    password: this.readEnvVariable('DB_PASSWORD', { required: true }),
    name: this.readEnvVariable('DB_NAME', { required: true }),
    autoSync: this.nodeEnv === 'development',
  };

  public readonly etherscan: EtherscanConfig = {
    apiKey: this.readEnvVariable('ETHERSCAN_API_KEY', { required: true }),
    baseUrl: this.readEnvVariable('ETHERSCAN_BASE_URL', { required: true }),
  };

  public readonly kraken: KrakenConfig = {
    apiKey: this.readEnvVariable('KRAKEN_API_KEY', { required: true }),
    apiSecret: this.readEnvVariable('KRAKEN_API_SECRET', { required: true }),
    baseUrl: this.readEnvVariable('KRAKEN_BASE_URL', {
      required: true,
      default: 'https://api.kraken.com',
    }),
    pairToBaseQuoteCurrencyMap: new Map([
      ['XETHZUSD', { baseCurrency: 'ETH', quoteCurrency: 'USD' }],
      ['USDCUSD', { baseCurrency: 'USDC', quoteCurrency: 'USD' }],
      ['GALAUSD', { baseCurrency: 'GALA', quoteCurrency: 'USD' }],
    ]),
  };

  public readonly coinGecko: CoinGeckoConfig = {
    timestampRangeInterval: 24 * 60 * 60 * 1000,
    coinIdMap: {
      ETH: 'ethereum',
      BTC: 'bitcoin',
      GALA: 'gala',
    },
    apiKey: this.readEnvVariable('COINGECKO_API_KEY', { required: true }),
  };

  public readonly chainEvent: ChainEventConfig = {
    earliestBlockNumber: 18908895,
    allowedTokenSymbols: ['GALA', 'ETH', 'BTC', 'USDC', 'USDT'],
  };
}

export default () => new Config();
