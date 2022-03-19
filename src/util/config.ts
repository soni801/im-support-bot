import type { ClientOptions, ColorResolvable, User } from 'discord.js';
import { Intents } from 'discord.js';
import './dotenv';

export const token = process.env.DISCORD_TOKEN;

const COLORS: { [key: string]: ColorResolvable } = {
  default: 'BLURPLE',
  success: 'GREEN',
  warning: 'DARK_ORANGE',
  error: 'DARK_RED',
};

export const CONSTANTS = {
  PREFIX: '?',
  ERRORS: {
    GENERIC: 'An error has occurred.',
    DEPLOY_FAILED: 'Failed to deploy!',
    CLIENT_DESTROY: 'Client destroyed, exiting process...',
    SHUTDOWN_USED: (user: User) =>
      `Shutdown command used by ${user.tag} on ${new Date()}`,
    COMMAND_RUN_ERROR:
      'An error occured while running the command, please try again later or contact the bot owner if the problem persists.',
    DISABLED: '🔒 This command has been disabled.',
    BOT_MISSING_PERMS:
      ':x: The command could not be preformed because one or more permissions are missing.',
    USER_MISSING_PERMS:
      ':lock: You do not have permission to use this command.',
    DB_NOT_CONNECTED: ':x: Database not connected, try again later.',
    UNKNOWN_SUBCOMMAND: ':x: Unknown subcommand.',
  },
  COLORS,
  wordBlockEnabled: process.env.WORD_BLOCK?.toLowerCase() === 'true',
  logLevel: process.env.LOG_LEVEL || 'debug',
};

export const clientOptions: ClientOptions = {
  allowedMentions: {
    parse: ['users', 'roles'],
  },

  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
};
