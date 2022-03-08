// Original:
// https://npmjs.com/package/discord-command-parser
// https://github.com/campbellbrendene/discord-command-parser

import Client from './Client';

// Copied due to repo being removed and fear of breaking

/**
 * The base message type with all the properties needed by the library.
 */
export interface BasicMessage {
  content: string;
  author: {
    bot: boolean;
  };
}

export interface SuccessfulParsedMessage<T extends BasicMessage> {
  readonly success: true;
  /** The prefix that the user provided. */
  readonly prefix: string;
  /** The name of the command issued. */
  readonly command: string;
  /** Everything after the command name. */
  readonly body: string;
  /** An array of command arguments. You might also consider using `reader`. */
  readonly arguments: string[];
  /** A wrapper around arguments with helper methods such as `getUserID()`. */
  readonly reader: MessageArgumentReader;
  /** The message. */
  readonly message: T;
}

export interface FailedParsedMessage<T extends BasicMessage> {
  readonly success: false;
  /** A description of why the parsing failed. */
  readonly error: string;
  /** The message. */
  readonly message: T;
  /** Error code */
  readonly code: number;
}

export type ParsedMessage<T extends BasicMessage> =
  | FailedParsedMessage<T>
  | SuccessfulParsedMessage<T>;

export interface ParserOptions {
  allowBots: boolean;
  allowSpaceBeforeCommand: boolean;
  ignorePrefixCase: boolean;
}

export enum ErrorCodes {
  NONE,
  BOT_ACCOUNT,
  NO_PREFIX,
  NO_BODY,
  SPACE_BEFORE_COMMAND,
  NO_COMMAND,
}

function getArguments(body: string): string[] {
  const args: string[] = [];
  let str = body.trim();

  while (str.length) {
    let arg: string;
    if (str.startsWith('"') && str.indexOf('"', 1) > 0) {
      arg = str.slice(1, str.indexOf('"', 1));
      str = str.slice(str.indexOf('"', 1) + 1);
    } else if (str.startsWith("'") && str.indexOf("'", 1) > 0) {
      arg = str.slice(1, str.indexOf("'", 1));
      str = str.slice(str.indexOf("'", 1) + 1);
    } else if (str.startsWith('```') && str.indexOf('```', 3) > 0) {
      arg = str.slice(3, str.indexOf('```', 3));
      str = str.slice(str.indexOf('```', 3) + 3);
    } else {
      arg = str.split(/\s+/g)[0].trim();
      str = str.slice(arg.length);
    }
    args.push(arg.trim());
    str = str.trim();
  }

  return args;
}

type Validator<T> = (value: T) => boolean;

export class MessageArgumentReader {
  args: string[];
  body: string;
  _index: number;

  constructor(args: string[], body: string) {
    this.args = args.slice();
    this.body = body;
    this._index = 0;
  }

  /** Returns the next argument (or null if exhausted) and advances the index (unless `peek` is `true`). */
  getString(peek = false, v?: Validator<string>): string | null {
    if (this._index >= this.args.length) return null;
    const value = this.args[peek ? this._index : this._index++];
    return v ? (v(value) ? value : null) : value;
  }

  /** Gets all the remaining text and advances the index to the end (unless `peek` is `true`). */
  getRemaining(peek = false): string | null {
    if (this._index >= this.args.length) return null;
    let remaining = this.body.trim();
    for (let i = 0; i < this._index; i++) {
      if (
        remaining.startsWith('"') &&
        remaining.charAt(this.args[i].length + 1) === '"'
      ) {
        remaining = remaining.slice(this.args[i].length + 2).trim();
      } else if (
        remaining.startsWith("'") &&
        remaining.charAt(this.args[i].length + 1) === "'"
      ) {
        remaining = remaining.slice(this.args[i].length + 2).trim();
      } else if (
        remaining.startsWith('```') &&
        remaining.slice(this.args[i].length + 3).startsWith('```')
      ) {
        remaining = remaining.slice(this.args[i].length + 6).trim();
      } else {
        remaining = remaining.slice(this.args[i].length).trim();
      }
    }
    if (!peek) this.seek(Infinity);
    return remaining;
  }

  /**
   * Advances the index (unless `peek` is `true`) and tries to parse an integer
   * using `Number.parseInt`, returning `null` if NaN.
   */
  getInt(peek = false, v?: Validator<number>): number | null {
    const str = this.getString(peek);
    if (str === null) return null;

    const parsed =
      Number.isNaN(str) || !/^-?\d+$/g.test(str) ? null : Number.parseInt(str);
    if (
      parsed === null ||
      parsed > Number.MAX_SAFE_INTEGER ||
      parsed < Number.MIN_SAFE_INTEGER
    )
      return null;
    return v ? (v(parsed) ? parsed : null) : parsed;
  }

  /**
   * Advances the index (unless `peek` is `true`) and tries to parse a floating-point number
   * (with a maximum guaranteed precision of 2 decimal places)
   * using `Number.parseFloat`, returning `null` if NaN or out of range.
   */
  getFloat(peek = false, v?: Validator<number>): number | null {
    const str = this.getString(peek);
    if (str === null) return null;

    const parsed =
      Number.isNaN(str) || !/^-?\d*(\.\d+)?$/.test(str)
        ? null
        : Number.parseFloat(str);
    if (
      parsed === null ||
      parsed > 703_687_441_77_664 ||
      parsed < -703_687_441_77_664
    )
      return null;
    return v ? (v(parsed) ? parsed : null) : parsed;
  }

  /** Advances the index (unless `peek` is `true`) and tries to parse a valid user ID or mention and returns the ID, if found. */
  getUserID(peek = false, v?: Validator<string>): string | null {
    const str = this.getString(peek);
    if (str === null) return null;
    if (/^\d{17,19}$/.test(str)) return str;
    const match = str.match(/^<@!?(\d{17,19})>$/);
    if (match && match[1])
      return v ? (v(match[1]) ? match[1] : null) : match[1];
    return null;
  }

  /** Advances the index (unless `peek` is `true`) and tries to parse a valid role ID or mention and returns the ID, if found. */
  getRoleID(peek = false, v?: Validator<string>): string | null {
    const str = this.getString(peek);
    if (str === null) return null;
    if (/^\d{17,19}$/.test(str)) return str;
    const match = str.match(/^<@&?(\d{17,19})>$/);
    if (match && match[1])
      return v ? (v(match[1]) ? match[1] : null) : match[1];
    return null;
  }

  /** Advances the index (unless `peek` is `true`) and tries to parse a valid channel ID or mention and returns the ID, if found. */
  getChannelID(peek = false, v?: Validator<string>): string | null {
    const str = this.getString(peek);
    if (str === null) return null;
    if (/^\d{17,19}$/.test(str)) return str;
    const match = str.match(/^<#(\d{17,19})>$/);
    if (match && match[1])
      return v ? (v(match[1]) ? match[1] : null) : match[1];
    return null;
  }

  /** Safely increments or decrements the index. Use this for skipping arguments. */
  seek(amount = 1): this {
    this._index += amount;
    if (this._index < 0) this._index = 0;
    if (this._index > this.args.length) this._index = this.args.length;
    return this;
  }
}

export default class CommandParser {
  options: ParserOptions;
  client: Client;

  constructor(client: Client, options: ParserOptions) {
    this.client = client;
    this.options = options;
  }

  parse<T extends BasicMessage>(
    message: T,
    prefix: string | string[],
    options: Partial<ParserOptions> = this.options
  ): ParsedMessage<T> {
    function fail(
      error: string,
      code: ErrorCodes = ErrorCodes.NONE
    ): FailedParsedMessage<T> {
      return { success: false, error, message, code };
    }

    const prefixes = Array.isArray(prefix) ? [...prefix] : [prefix];

    if (message.author.bot && !options.allowBots)
      return fail('Message sent by a bot account', ErrorCodes.BOT_ACCOUNT);

    if (!message.content) return fail('Message body empty', ErrorCodes.NO_BODY);

    let matchedPrefix: string | null = null;
    for (const p of prefixes) {
      if (
        (options.ignorePrefixCase &&
          message.content.toLowerCase().startsWith(p.toLowerCase())) ||
        message.content.startsWith(p)
      ) {
        matchedPrefix = p;
        break;
      }
    }

    if (!matchedPrefix)
      return fail('Message does not start with prefix', ErrorCodes.NO_PREFIX);

    let remaining = message.content.slice(matchedPrefix.length);

    if (!remaining) return fail('No body after prefix', ErrorCodes.NO_BODY);
    if (!options.allowSpaceBeforeCommand && /^\s/.test(remaining))
      return fail('Space before command name', ErrorCodes.SPACE_BEFORE_COMMAND);

    remaining = remaining.trim();

    const command = remaining.match(/^[^\s]+/i)?.[0];
    if (!command)
      return fail('Could not match a command', ErrorCodes.NO_COMMAND);
    remaining = remaining.slice(command.length).trim();

    const args = getArguments(remaining);

    return {
      success: true,
      message,
      prefix: matchedPrefix,
      arguments: args,
      reader: new MessageArgumentReader(args, remaining),
      body: remaining,
      command,
    };
  }
}
