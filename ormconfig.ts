import type { ConnectionOptions } from 'typeorm';
import { config as envConfig } from 'dotenv';
import { existsSync } from 'fs';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// If ormconfig.local.ts exists, merge the defaults from here with the values from it

const paths: string[] = [];
switch (process.env.NODE_ENV) {
  case 'prod':
  case 'production': {
    paths.push('./.env.production');
    paths.push('./.env.production.local');
    break;
  }
  case 'test':
  case 'testing': {
    paths.push('./.env.test');
    paths.push('./.env.test.local');
    break;
  }
  default: {
    paths.push('./.env.development');
    paths.push('./.env.development.local');
    break;
  }
}

paths.forEach((path) => envConfig({ path }));

const entities = process.env.NODE_ENV !== "development"
                   ? ['dist/**/*.entity.js']
                   : ['src/**/*.entity.ts'];

const migrations = process.env.NODE_ENV !== "development"
                   ? ['dist/src/migration/*.js']
                   : ['src/migration/*.ts'];

let ormConfig: ConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'im_support_bot',
  synchronize: true,
  logging: ['error'],
  namingStrategy: new SnakeNamingStrategy(),

  entities,
  migrations,

  cli: {
    entitiesDir: 'src/entities',
    migrationsDir: 'src/migration',
  },
};

if (existsSync('./ormconfig.local.ts')) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const localConfig = require('./ormconfig.local.ts');
  ormConfig = Object.assign(ormConfig, localConfig);
}

export default ormConfig;
