import {
  Client as DiscordClient,
  ClientOptions,
  Collection,
  MessageEmbed,
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { readdir } from 'fs/promises';
import { basename, resolve } from 'path';
import Command from './Command';
import CommandParser from './CommandParser';
import { CONSTANTS } from './config';
import Logger from './Logger';

export default class Client<
  T extends boolean = boolean
> extends DiscordClient<T> {
  commands: Collection<string, Command> = new Collection();
  aliases: Collection<string, string> = new Collection();

  slashCommands: Collection<string, SlashCommandBuilder> = new Collection();

  logger = new Logger(Client.name);
  admins = new Set<string>();

  parser: CommandParser;

  constructor(options: ClientOptions) {
    super(options);

    this.parser = new CommandParser(this, {
      allowBots: false,
      allowSpaceBeforeCommand: false,
      ignorePrefixCase: false,
    });

    this.admins.add('279692618391093248');

    this.loadCommands('../commands');
    this.loadEvents('../events');
    this.loadSlashCommands('../slashCommands');

    this.on('error', (err) => {
      console.error(err);
    });
  }

  /**
   * Default embed
   * @param {MessageEmbed} [embed] Discord.js's MessageEmbed takes an embed as a param
   */
  defaultEmbed(embed?: MessageEmbed): MessageEmbed {
    return new MessageEmbed(embed)
      .setColor(CONSTANTS.COLORS.default)
      .setFooter({
        text: this.user?.tag ?? '',
        iconURL: this.user?.avatarURL({ format: 'png', dynamic: true }) ?? '',
      });
  }

  registerCommand(command: Command) {
    this.commands.set(command.config.name, command);
    if (command.config.aliases) {
      command.config.aliases.forEach((alias) => {
        this.aliases.set(alias, command.config.name);
      });
    }
  }

  getCommand(name: string): Command | undefined {
    let command = this.commands.get(name);

    if (!command) {
      command = this.commands.get(this.aliases.get(name) as string);
    }

    return command;
  }

  async loadCommands(dir: string) {
    this.logger.verbose(`Loading commands from ${dir}...`);

    const files = await readdir(resolve(__dirname, dir));
    this.logger.debug(`Found ${files.length} files.`);

    for (const file of files) {
      const filePath = resolve(__dirname, dir, file);

      const command: Command = new (await import(filePath)).default(this);

      command.config.filePath = filePath;

      this.registerCommand(command);
    }

    this.logger.info(`Loaded ${this.commands.size} commands.`);
  }

  async loadEvents(dir: string) {
    this.logger.verbose(`Loading events from ${dir}...`);

    let n = 0;

    const files = await readdir(resolve(__dirname, dir));
    this.logger.debug(`Found ${files.length} files.`);

    for (const file of files) {
      const filePath = resolve(__dirname, dir, file);

      if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;

      const event = (await import(filePath)).default;
      const eventName = basename(file).split('.')[0];

      this.on(eventName as any, event.bind(null, this));

      n++;

      this.logger.debug(`Loaded event ${eventName}`);
    }

    this.logger.info(`Loaded ${n} events.`);
  }

  async loadSlashCommands(dir: string) {
    this.logger.verbose(`Loading slash commands from ${dir}...`);

    const files = await readdir(resolve(__dirname, dir));
    this.logger.debug(`Found ${files.length} files.`);

    for (const file of files) {
      const filePath = resolve(__dirname, dir, file);

      if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;

      const builder = await (await import(filePath)).default();

      this.slashCommands.set(builder.name, builder);
      this.logger.debug(`Loaded slash command ${builder.name}`);
    }

    this.logger.info(`Loaded ${this.slashCommands.size} slash commands.`);
  }
}
