import {
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageEmbed,
} from 'discord.js';
import Client from './Client';
import homoglyphs from '../data/homoglyphs.json';
import INTERACTION_IDS from './INTERACTION_IDS';

/**
 * Ask for confirmation before proceeding
 * @param {Message} message Discord.js message object
 * @param {string} confirmationMessage Ask for confirmation
 * @param {ConfirmationOptions} [options] Options
 * @param {string} [options.confirmMessage] Edit the message upon confirmation
 * @param {string | MessageEmbed} [options.denyMessage] Edit the message upon denial
 * @param {number} options.time Timeout
 * @param {boolean} [options.keepReactions] Keep reactions after reacting
 * @param {boolean} [options.deleteAfterReaction] Delete the message after reaction (takes priority over all other messages)
 * @example
 * const confirmationMessage: string = 'Are you sure you would like to stop the bot?'
 * const options: ConfirmationOptions = {
 *   confirmMessage: 'Shutting down...',
 *   denyMessage: 'Shutdown cancelled.'
 * }
 *
 * const proceed: boolean = await confirmation(message, confirmationMessage, options)
 *
 * if (proceed) process.exit(0)
 */
export async function confirmation(
  message: Message,
  confirmationMessage: string | MessageEmbed,
  options: ConfirmationOptions = {
    deleteAfter: false,
    deleteButtons: false,
    timeout: 10_000,
  }
): Promise<boolean> {
  const yesButton = new MessageButton()
    .setEmoji('✅')
    .setLabel('Yes')
    .setStyle('DANGER')
    .setCustomId(INTERACTION_IDS.CONFIRM_YES);
  const noButton = new MessageButton()
    .setEmoji('❌')
    .setLabel('No')
    .setStyle('SUCCESS')
    .setCustomId(INTERACTION_IDS.CONFIRM_NO);

  const buttons = new MessageActionRow({
    components: [yesButton, noButton],
  });
  const msg = await message.channel.send(
    confirmationMessage instanceof MessageEmbed
      ? {
          embeds: [confirmationMessage],
          components: [buttons],
        }
      : { content: confirmationMessage, components: [buttons] }
  );

  const collector = msg.createMessageComponentCollector({
    filter: (interaction) => interaction.user.id === message.author.id,
    time: options.timeout,
    max: 1,
  });

  return await new Promise<MessageComponentInteraction>((resolve, reject) => {
    collector.on('collect', (i) => {
      if (i.customId === yesButton.customId) {
        resolve(i);
      } else if (i.customId === noButton.customId) {
        reject(i);
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        reject(null);
      }
    });
  })
    .then(async (i) => {
      i.deferUpdate();
      if (options.deleteAfter) {
        await msg.delete();
      } else if (options?.confirmMessage) {
        await msg.edit(
          options?.confirmMessage instanceof MessageEmbed
            ? { embeds: [options?.confirmMessage], content: null }
            : { embeds: null, content: options?.confirmMessage }
        );
      }
      return true;
    })
    .catch(async (i: MessageComponentInteraction) => {
      i.deferUpdate();
      if (options.deleteAfter) {
        await msg.delete();
      } else if (options?.denyMessage) {
        await msg.edit(
          options?.denyMessage instanceof MessageEmbed
            ? { embeds: [options?.denyMessage], content: null }
            : { embeds: null, content: options?.denyMessage }
        );
      }
      return false;
    })
    .finally(() => {
      if (options.deleteAfter) {
        msg.delete();
      } else if (options.deleteButtons) {
        msg.edit({ components: [] });
      }
    });
}

/**
 * Pluralize a word based on a number
 *
 * @export
 * @template T Type of the word
 * @param {number} num the number to use for the pluralization
 * @param {T} singularMessage the singular form of the word
 * @param {T} pluralMessage the plural form of the word
 * @return {T} the pluralized word
 */
export function plural<T = string>(
  num: number,
  singularMessage: T,
  pluralMessage: T
): T {
  if (num > 1) return pluralMessage;
  return singularMessage;
}

/**
 * A simple text cleaner.
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 * @link https://github.com/Costpap/CostBot/blob/master/src/utils/misc.ts#L20-L38
 * @example
 * import { clean } from './utils/misc';
 *
 * const code: string = args.join(', ');
 * const evaled = await eval(code);
 *
 * console.log(clean(evaled));
 */
export const clean = (text: string): string => {
  if (typeof text === 'string') {
    return text
      .replace(/`/g, '`' + String.fromCharCode(8203))
      .replace(/@/g, '@' + String.fromCharCode(8203));
  } else {
    return text;
  }
};

export const replaceHomoglyphs = (text: string): string => {
  Object.entries(homoglyphs).forEach(([originalLetter, glyphs]) => {
    glyphs.forEach((substitute) => {
      const regex = new RegExp(substitute, 'g');
      text = text.replace(regex, originalLetter);
    });
  });

  return text;
};

/**
 * Parses a Markdown codeblock and returns the text inside of it.
 * @link https://github.com/Costpap/CostBot/blob/master/src/utils/misc.ts#L40-L52
 * @param {string} script - The code to parse
 * @returns {string} Code without codeblock
 */
export const parseCodeblock = (script: string): string => {
  const cbr = /^(([ \t]*`{3,4}([\w]*))?([^\n]*)([\s\S]+?)(^[ \t]*\2))/gm;
  const result = cbr.exec(script);
  if (result) {
    return result[4];
  }
  return script;
};

export const wrapCodeblock = (str: string, lang = 'js') =>
  `\`\`\`${lang}\n${str}\n\`\`\``;
export const wrapInlineCode = (str: string) => `\`${str}\``;

/**
 * Get the permission level for a user
 * Key:
 * 3: bot administrators
 * 2: server administrators
 * 1: server moderators
 * 0: everyone else
 *
 * @param {GuildMember} user The user to check
 * @returns {number}
 */
export async function getLevel(user: GuildMember): Promise<number> {
  if (!(user instanceof GuildMember))
    throw new TypeError('User must be a GuildMember');
  // user is a bot administrator
  if ((user.client as Client).admins.has(user.user.id)) return 3;
  // user has 'ADMINISTRATOR'
  if (
    user.permissions.has('ADMINISTRATOR') ||
    (await user.guild.fetchOwner()).user.id === user.user.id
  )
    return 2;
  // user isnt special
  return 0;
}

export interface ConfirmationOptions {
  /** Edit the message after confirming */
  confirmMessage?: string | MessageEmbed;
  /** Edit the message after denying */
  denyMessage?: string | MessageEmbed;
  /** Delete the message after receiving a reaction */
  deleteAfter?: boolean;
  /** Timeout */
  timeout?: number;
  /** Keep the reactions upon reacting */
  deleteButtons?: boolean;
}
