import type { ClientOptions, ColorResolvable } from 'discord.js';
import { Intents } from 'discord.js';
import { config as envConfig } from 'dotenv';

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

export const token = process.env.DISCORD_TOKEN;

export const CONSTANTS = {
  PREFIX: '?',
  ERRORS: {
    GENERIC: 'An error has occurred.',
  },
  COLORS: {
    default: 'BLURPLE',
    warning: 'DARK_RED',
  } as { [key: string]: ColorResolvable },
  wordBlockEnabled: false,
  logLevel: process.env.LOG_LEVEL || 'debug',
};

export const clientOptions: ClientOptions = {
  allowedMentions: {
    parse: ['users', 'roles'],
  },

  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
};
