import type { ConnectionOptions } from 'typeorm';
import { existsSync } from 'fs';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import './src/util/dotenv';

const entities =
  process.env.NODE_ENV !== 'development'
    ? ['dist/**/*.entity.js']
    : ['src/**/*.entity.ts'];

const migrations =
  process.env.NODE_ENV !== 'development'
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

// If ormconfig.local.ts exists, merge the defaults from here with the values from it
if (existsSync('./ormconfig.local.ts')) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const localConfig = require('./ormconfig.local.ts');
  ormConfig = Object.assign(ormConfig, localConfig);
}

export default ormConfig;
