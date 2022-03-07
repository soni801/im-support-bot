/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Message, TextChannel } from 'discord.js';
import Client from './Client';
import { CONSTANTS } from './config';
import { MessageTypes } from 'discord.js/typings/enums';
import { blocklist } from '../data/blocklist.json';
import Logger from './Logger';

const logger = new Logger('handleBlocklisted');

export default async function (client: Client, msg: Message, oldMsg?: Message) {
  const origMsg = msg.content;

  const handleMsgTypes: (keyof typeof MessageTypes)[] = ['DEFAULT', 'REPLY'];

  if (!handleMsgTypes.includes(msg.type)) return;

  if (!CONSTANTS.wordBlockEnabled) return;

  blocklist.forEach(async (e) => {
    const re = new RegExp(`^${e}$`, 'g');

    if (!msg.content.match(re)) return;

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
  });
}
