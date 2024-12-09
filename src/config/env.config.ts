import { parseBooleans } from 'xml2js/lib/processors';

interface ServerConfig {
  port: number;
  secret: string;
  expirationTime: number;
}

interface CacheConfig {
  host: string;
  port: number;
  auth_pass: string;
  tls: boolean;
}

interface Web3Config {
  networkId: number;
  walletPrivateKey: string;
  walletPublicKey: string;
  infuraProjectId: string;
}

interface SentinelConfig {
  port: number;
  host: string;
  name: string;
}
export interface DatabaseConfig {
  type: string;
  host: string;
  username: string;
  password: string;
  database: string;
  port: number;
  entities: string[];
  synchronize: boolean;
  dropSchema: boolean;
  logging: boolean;
  migrationsTableName: string;
  migrations: string[];
  cli: { migrationsDir: string };
  migrationsRun: boolean;
}

export default () => {
  const serverConfig: ServerConfig = {
    port: parseInt(process.env.SERVER_PORT) || 3000,
    secret: process.env.SERVER_JWT_SECRET || 'TopseyCret',
    expirationTime: parseInt(process.env.SERVER_JWT_EXPIRATION_TIME),
  };

  const cacheConfig: CacheConfig = {
    host: process.env.CACHE_SERVER_HOST || 'localhost',
    port: parseInt(process.env.CACHE_SERVER_PORT) || 6379,
    auth_pass: process.env.CACHE_SERVER_PASSWORD || '',
    tls: parseBooleans(process.env.CACHE_SERVER_TLS) || false,
  };

  const databaseConfig: DatabaseConfig = {
    type: 'postgres',
    host: process.env.TYPEORM_HOST || 'localhost',
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    port: parseInt(process.env.TYPEORM_PORT) || 5432,
    entities: [`dist/**/*.entity{.ts,.js}`],
    synchronize: process.env.TYPEORM_SYNCHRONIZE ? process.env.TYPEORM_SYNCHRONIZE === 'true' : false,
    dropSchema: process.env.TYPEORM_DROP_SCHEMA ? process.env.TYPEORM_DROP_SCHEMA === 'true' : false,
    logging: process.env.TYPEORM_LOG ? process.env.TYPEORM_LOG === 'true' : false,
    migrationsTableName: 'database_migration',
    migrations: ['dist/migration/*{.ts,.js}'],
    cli: {
      migrationsDir: 'src/migration',
    },
    migrationsRun: process.env.TYPEORM_RUN_MIGRATION ? process.env.TYPEORM_RUN_MIGRATION === 'true' : true,
  };

  const web3Config: Web3Config = {
    networkId: parseInt(process.env.NETWORK_ID) || 4, //Rinkeby Network
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY,
    walletPublicKey: process.env.WALLET_PUBLIC_KEY,
    infuraProjectId: process.env.INFURA_KEY,
  };

  const sentinelConfig: SentinelConfig = {
    host: process.env.SENTINEL_HOST,
    port: parseInt(process.env.SENTINEL_PORT),
    name: process.env.SENTINEL_NAME,
  };

  return {
    server: serverConfig,
    database: databaseConfig,
    web3: web3Config,
    cache: cacheConfig,
    sentinel: sentinelConfig,
  };
};
