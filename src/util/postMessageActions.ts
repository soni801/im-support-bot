/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { DiscordAPIError, Message, TextChannel } from 'discord.js';
import type { MessageTypes } from 'discord.js/typings/enums';

import { RESTJSONErrorCodes } from 'discord-api-types/v9';
import { CONSTANTS } from './config';
import Client from './Client';
import Logger from './Logger';

import blocklist from '../data/blocklist.json';
import respondList from '../data/respondList.json';
import emojiReactList from '../data/emojiReactList.json';

/**
 * handles postMessage actions
 *
 * @export
 * @param {Client} client - the client
 * @param {Message} msg - the message
 * @param {Message} [oldMsg] - the old message
 * @return {Promise<void>} the promise
 */
export default async function handlePostMessage(
  client: Client,
  msg: Message,
  oldMsg?: Message
): Promise<void> {
  const deleted = await handleBlocklisted(client, msg, oldMsg);

  if (deleted) return;

  await Promise.allSettled([
    replyToMessages(client, msg),
    msgReactionHandle(client, msg),
  ]);
}

/**
 * replies to certain messages from a json file
 *
 * @export
 * @param {Client} client - the client
 * @param {Message} msg - the message
 */
export async function replyToMessages(client: Client, msg: Message) {
  const logger = new Logger(replyToMessages.name);

  const strings: {
    search: string[];
    response: string;
    users: string[];
    embedSearch: { image?: string[] };
  }[] = respondList;

  for (const string of strings) {
    if (!string.users.includes(msg.author.id)) continue;

    const contains =
      string.search.some((search) => msg.content.includes(search)) ||
      string.embedSearch?.image?.some((search) =>
        msg.embeds.some((embed) => embed.image?.url?.includes(search))
      );

    if (contains) {
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

/**
 * reacts to certain messages
 *
 * @export
 * @param {Client} client - the client
 * @param {Message} msg - the message
 */
export async function msgReactionHandle(client: Client, msg: Message) {
  const logger = new Logger(msgReactionHandle.name);

  const emojis: string[] = emojiReactList;

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

/**
 * Handle blocklisted words
 *
 * @export
 * @param {Client} client - the client
 * @param {Message} msg - the message
 * @param {Message} [oldMsg] - an old message if it exists
 * @return {Promise<boolean>} - whether the message was deleted
 */
export async function handleBlocklisted(
  client: Client,
  msg: Message,
  oldMsg?: Message
): Promise<boolean> {
  const logger = new Logger(handleBlocklisted.name);

  const origMsg = msg.content;

  const handleMsgTypes: (keyof typeof MessageTypes)[] = ['DEFAULT', 'REPLY'];

  if (!handleMsgTypes.includes(msg.type)) return false;

  if (!CONSTANTS.wordBlockEnabled) return false;

  const deletedStuff = await Promise.all(
    blocklist.map(async (e) => {
      const re = new RegExp(`^${e}$`, 'g');

      if (!msg.content.match(re)) return false;

      msg
        .delete()
        .then(async () =>
          logger.info(
            `Deleted message containing \x1b[31m'${e}'\x1b[0m from \x1b[33m'${
              msg.author.tag
            }'\x1b[0m (${msg.author.id} in #${
              ((await msg.channel.fetch()) as TextChannel).name
            }, ${msg.guild!.name}: \x1b[32m"${origMsg}"\x1b[0m${
              oldMsg
                ? ' (edited from \x1b[32m"' + oldMsg.content + '"\x1b[0m)'
                : ''
            }`
          )
        )
        .catch((err) => {
          logger.warn("Couldn't delete message: ");
          console.warn(err);
        });

      const embed = client
        .defaultEmbed()
        .setAuthor({
          name: 'Stop, my g',
          iconURL:
            'https://media.discordapp.net/attachments/877474626710671371/903598778827833344/help_stop.png',
        })
        .addField(
          `Do not "${e} me!`,
          `I do not approve of this ${msg.author} :woozy_face: :gun:`
        )
        .setTimestamp()
        .setFooter({
          text: client.user!.tag,
          iconURL: client.user!.displayAvatarURL(),
        });

      msg.channel
        .send({
          embeds: [embed],
        })
        .catch((err) => {
          logger.warn(`Couldn't send message:`);
          console.warn(err);
        });

      return true;
    })
  );

  return deletedStuff.some((e) => e);
}
