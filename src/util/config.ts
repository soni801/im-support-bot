import type { ClientOptions, ColorResolvable } from 'discord.js';
import { Intents } from 'discord.js';
import './dotenv';

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
