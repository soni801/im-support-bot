import type { DiscordAPIError, Message } from 'discord.js';
import { RESTJSONErrorCodes } from 'discord-api-types/v9';
import Client from './Client';
import Logger from './Logger';

const logger = new Logger(msgReactionHandle.name);

export async function msgReactionHandle(client: Client, msg: Message) {
  const emojis: string[] = [
    '<:huehueheinz:817122325556101150>',
    ':bread:',
    '🍞',
  ];

  for (const emoji of emojis) {
    if (msg.content.includes(emoji)) {
      await msg.react(emoji).catch((err: DiscordAPIError) => {
        if (err.code === RESTJSONErrorCodes.UnknownEmoji) {
          // Uknknown emoji
          logger.warn(err.message);
        }
      });
    }
  }
}
