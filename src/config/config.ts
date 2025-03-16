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
}

export default () => new Config();
