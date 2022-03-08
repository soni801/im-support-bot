import type { DiscordAPIError, Message } from 'discord.js';
import { RESTJSONErrorCodes } from 'discord-api-types/v9';
import Client from './Client';
import Logger from './Logger';

const logger = new Logger(replyToMessages.name);

export async function replyToMessages(client: Client, msg: Message) {
  const strings: { search: string; response: string; users: string[] }[] = [
    {
      search: 'store.steampowered.com/app/1909560',
      response: 'SHUT THE FUCK UP ABOUT YOUR GODAMN GAME',
      users: ['181719848655519744'], // PatrickRMC#5003
    },
  ];

  for (const string of strings) {
    if (!string.users.includes(msg.author.id)) continue;

    if (msg.content.includes(string.search)) {
      await msg.reply(string.response).catch((err: DiscordAPIError) => {
        if (err.code === RESTJSONErrorCodes.UnknownEmoji) {
          // Uknknown emoji
          logger.warn(err.message);
        }

        logger.warn(JSON.stringify(err));
      });
    }
  }
}
