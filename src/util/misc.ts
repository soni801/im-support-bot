import {
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageEmbed,
} from 'discord.js';
import { findBestMatch } from 'string-similarity';

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
 * @param {boolean} [options.deleteAfter] Delete the message after reaction (takes priority over all other messages)
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
      if (options?.confirmMessage) {
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
      if (options?.denyMessage) {
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

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Capture stdout and stderr while executing a function
 * @param {Function} callback The callback function to execute
 * @returns {Promise<CapturedOutput>} stdout, stderr and callback outputs
 */
export async function captureOutput(
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback: Function
): Promise<{ stdout: string; stderr: string; callbackOutput?: any }> {
  return await new Promise((resolve, reject) => {
    const oldProcess = { ...process };
    let stdout = '';
    let stderr = '';

    // overwrite stdout write function
    process.stdout.write = (str: string) => {
      stdout += str;
      return true;
    };

    // overwrite stderr write function
    process.stderr.write = (str: string) => {
      stderr += str;
      return true;
    };

    try {
      const c = callback();

      // @ts-expect-error - cuz reasons im not really sure
      delete process.stdout.write;
      process.stdout.write = oldProcess.stdout.write;

      // @ts-expect-error - cuz reasons im not really sure
      delete process.stderr.write;
      process.stderr.write = oldProcess.stderr.write;

      return c
        .catch((c: Error) => reject({ stdout, stderr, callbackOutput: c })) // eslint-disable-line prefer-promise-reject-errors
        .then((callbackOutput: any) =>
          resolve({ stdout, stderr, callbackOutput })
        );
    } catch (error) {
      // @ts-expect-error - cuz reasons im not really sure
      delete process.stdout.write;
      process.stdout.write = oldProcess.stdout.write;

      // @ts-expect-error - cuz reasons im not really sure
      delete process.stderr.write;
      process.stderr.write = oldProcess.stderr.write;
      return reject({ stdout, stderr, callbackOutput: error }); // eslint-disable-line prefer-promise-reject-errors
    }
  });
}

/**
 * Find the closest matching string from an array
 * @param {string} search The string to compare
 * @param {string[]} mainStrings The strings to find the closest match in
 * @returns {string | null}
 * @example
 * const search: string = 'Admin'
 * const strings: string[] = ['Administrator', 'Developer', 'Moderator']
 * const options: MatchStringOptions = { minRating: 0.4 }
 *
 * const match: string | null = matchString(search, strings, options)
 * // match: 'Administrator'
 */
export function matchString(
  search: string,
  mainStrings: string[],
  ops?: MatchStringOptions
): string | null {
  const {
    bestMatchIndex,
    bestMatch: { rating },
  } = findBestMatch(search, mainStrings);

  if (rating < (ops?.minRating ?? 0.5)) return null;

  return mainStrings[bestMatchIndex];
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

interface MatchStringOptions {
  /** Only return a string if it is a certain % similar */
  minRating?: number;
}
