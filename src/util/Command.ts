import { Message, PermissionResolvable } from 'discord.js';
import Client from './Client';

export default abstract class Command {
  client: Client<true>;
  abstract config: CommandOptions;

  constructor(client: Client) {
    this.client = client;
  }

  abstract run(msg: Message, ...args: any): Promise<any | undefined | null>;
}

export type CommandCategories = 'admin' | 'owner' | 'info' | string;

export interface CommandOptions {
  /** The command name */
  name: string;
  /** Command aliases */
  aliases?: string[];
  /** Disable the command */
  disabled?: boolean;
  /** Permission level required to use the command */
  level?: 0 | 1 | 2 | 3;
  /** Where the command file is located. Set automatically. */
  filePath?: string;
  /** Don't load the command */
  skipLoading?: boolean;
  /** Info for the help command */
  help?: {
    /** Short description of the command */
    shortDescription?: string;
    /** A description of the command */
    description?: string;
    /** What category the command is in */
    category?: CommandCategories;
    /** Hide the command from the help command */
    hidden?: boolean;
    /** Command usage */
    usage?: string;
  };
  permissions?: {
    user?: PermissionResolvable[];
    bot?: PermissionResolvable[];
  };
}
