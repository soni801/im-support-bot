import { config as envConfig } from 'dotenv';

const paths: string[] = [];
switch (process.env.NODE_ENV) {
  case 'prod':
  case 'production': {
    paths.push('./.env.production.local');
    paths.push('./.env.production');
    break;
  }
  case 'test':
  case 'testing': {
    paths.push('./.env.test.local');
    paths.push('./.env.test');
    break;
  }
  default: {
    paths.push('./.env.development.local');
    paths.push('./.env.development');
    break;
  }
}

paths.forEach((path) => envConfig({ path }));
