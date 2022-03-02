import {
  Client as DiscordClient,
  ClientOptions,
  Collection,
  GuildMember,
  MessageEmbed,
  PermissionOverwrites,
  Permissions,
  Team,
  TextChannel,
  ThreadChannel,
  User,
} from 'discord.js';
import { readdir } from 'fs/promises';
import { basename, resolve } from 'path';
import { Connection } from 'typeorm';

import Command from './Command';
import CommandParser from './CommandParser';
import { CONSTANTS } from './config';
import Logger from './Logger';
import ormconfig from '../../ormconfig';
import Guild from '../entities/Guild.entity';
import { Interaction } from '../types/Interaction';

export default class Client<
  T extends boolean = boolean
> extends DiscordClient<T> {
  commands: Collection<string, Command> = new Collection();
  aliases: Collection<string, string> = new Collection();

  slashCommands: Collection<string, Interaction> = new Collection();

  logger = new Logger(Client.name);
  admins = new Set<string>(['279692618391093248']);

  timeouts: NodeJS.Timeout[] = [];

  parser: CommandParser = new CommandParser(this, {
    allowBots: false,
    allowSpaceBeforeCommand: false,
    ignorePrefixCase: false,
  });

  db = new Connection(ormconfig);

  constructor(options: ClientOptions) {
    super(options);

    this.on('error', (err) => {
      console.error(err);
    });

    this.connectDb().then(() =>
      Promise.all([
        this.loadCommands('../commands'),
        this.loadEvents('../events'),
        this.loadSlashCommands('../slashCommands'),
      ])
    );
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

      const command: Interaction = new (await import(filePath)).default(this);

      this.slashCommands.set(command.name, command);
      this.logger.debug(`Loaded slash command ${command.name}`);
    }

    this.logger.info(`Loaded ${this.slashCommands.size} slash commands.`);
  }

  async connectDb() {
    this.logger.verbose('Connecting to database...');

    await this.db.connect().catch((err: Error) => {
      this.logger.error(`Failed to connect to database: ${err.message}`);
      Promise.reject(err);
    });

    this.logger.info(`Connected to database ${this.db.options.database}.`);
  }

  async syncDb() {
    const guildRepository = this.db.getRepository(Guild);

    // Array of functions that check if a guild exists in the database and if not, create it
    const guilds = this.guilds.cache.map(
      (guild) => async () =>
        await guildRepository
          .findOne({ where: { guildId: guild.id } })
          .then(async (g) => {
            if (!g) {
              await guildRepository.save([
                new Guild({
                  guildId: guild.id,
                }),
              ]);
            }
          })
    );

    await Promise.all(guilds);
  }

  async getLevel(user: GuildMember) {
    if (!(user instanceof GuildMember))
      throw new TypeError('User must be a GuildMember');
    // user is a bot administrator
    if (this.admins.has(user.user.id)) return 3;
    // user has 'ADMINISTRATOR'
    const owner = await user.guild.fetchOwner();

    if (user.permissions.has('ADMINISTRATOR') || owner.user.id === user.user.id)
      return 2;
    // user isnt special
    return 0;
  }

  /**
   * Get missing permissions for the bot and the user
   * @param {Command} command The command to check for
   * @param {GuildMember} member The user to check permissions for
   * @param {TextChannel} channel What channel the command was used in
   */
  checkPermissions(
    command: Command,
    member: GuildMember,
    channel?: TextChannel
  ): { user: Permissions; bot: Permissions } {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const bot = member.guild.me!;

    const userPerms = member.permissions;
    let botPerms = bot.permissions;

    const requiredPerms = {
      bot: new Permissions(command.config?.permissions?.bot ?? 0n),
      user: new Permissions(command.config?.permissions?.user ?? 0n),
    };

    let channelOverwrites: PermissionOverwrites[] = [];
    if (channel)
      channelOverwrites = channel.permissionOverwrites.cache.toJSON();

    for (const permissionOverwrite of channelOverwrites) {
      if (
        (permissionOverwrite.type === 'role' &&
          bot.roles.cache.has(permissionOverwrite.id)) ||
        (permissionOverwrite.type === 'member' &&
          bot.id === permissionOverwrite.id)
      ) {
        botPerms = botPerms.remove(permissionOverwrite.deny);
        botPerms = botPerms.add(permissionOverwrite.allow);
      }
    }

    const missing = {
      user: new Permissions(),
      bot: new Permissions(),
    };

    if (!userPerms.has(requiredPerms.user))
      missing.user = new Permissions(userPerms.missing(requiredPerms.user));
    if (!botPerms.has(requiredPerms.bot))
      missing.bot = new Permissions(botPerms.missing(requiredPerms.bot));

    return missing;
  }

  /**
   * Fetch team members from the client's dev portal team
   * @returns {Promise<User[]>}
   * @example
   * const teamMembers: User[] = await client.fetchTeamMembers()
   */
  async fetchTeamMembers(): Promise<User[]> {
    const { owner } = (await this.application?.fetch()) ?? { owner: null };

    if (owner instanceof Team) {
      return owner.members.map((t) => t.user);
    }
    if (owner instanceof User) {
      return [owner];
    }
    throw new Error('Error fetching team members');
  }
}
