import type { ClientOptions, ColorResolvable } from 'discord.js';
import { Intents } from 'discord.js';
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
  wordBlockEnabled: process.env.WORD_BLOCK === 'true',
  logLevel: process.env.LOG_LEVEL || 'debug',
};

export const clientOptions: ClientOptions = {
  allowedMentions: {
    parse: ['users', 'roles'],
  },

  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
};
