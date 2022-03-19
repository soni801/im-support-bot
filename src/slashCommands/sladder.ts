import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, CacheType } from 'discord.js';
import { Repository } from 'typeorm';
import Fuse from 'fuse.js';
import { Sladder } from '../entities/Sladder.entity';
import Guild from '../entities/Guild.entity';
import { Interaction } from '../types/Interaction';
import Client from '../util/Client';
import Logger from '../util/Logger';

export enum SubcommandNames {
  list = 'list',
  get = 'get',
  search = 'search',
  add = 'add',
  remove = 'remove',
}

export enum SubcommandArguments {
  id = 'id',
  public = 'public',
  content = 'content',
  query = 'query',
}

export default class SlashSladder implements Interaction {
  client: Client;
  logger: Logger = new Logger(SlashSladder.name);
  name = 'sladder';

  sladderRepository: Repository<Sladder>;
  guildRepository: Repository<Guild>;

  fuseOptions: Fuse.IFuseOptions<Sladder> = {
    keys: ['content', 'id'],
    threshold: 0.3,
  };

  constructor(client: Client) {
    this.client = client;

    this.sladderRepository = client.db.getRepository(Sladder);
    this.guildRepository = client.db.getRepository(Guild);
  }

  async slashCommand() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Sladder commands for all your sladder needs.')
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.search)
          .setDescription('Search all the local sladders.')
          .addStringOption((input) =>
            input
              .setName(SubcommandArguments.query)
              .setRequired(true)
              .setDescription('The query to search for.')
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.list)
          .setDescription('List all the local sladders.')
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.get)
          .setDescription('Get a specific sladder.')
          .addNumberOption((input) =>
            input
              .setName(SubcommandArguments.id)
              .setRequired(true)
              .setDescription('The id of the sladder to get.')
          )
          .addBooleanOption((input) =>
            input
              .setName(SubcommandArguments.public)
              .setDescription(
                'Send the sladder to the channel and not just reply to the slash command'
              )
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.add)
          .setDescription('Create a new sladder.')
          .addStringOption((input) =>
            input
              .setName(SubcommandArguments.content)
              .setDescription('Sladder sladder')
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.remove)
          .setDescription('Remove a sladder.')
          .addNumberOption((input) =>
            input
              .setName(SubcommandArguments.id)
              .setRequired(true)
              .setDescription('The id of the sladder to remove.')
          )
      );
  }

  public async execute(i: CommandInteraction<CacheType>): Promise<void> {
    switch (i.options.getSubcommand()) {
      case SubcommandNames.search: {
        await this.search(i);
        break;
      }

      case SubcommandNames.list: {
        await this.list(i);
        break;
      }

      case SubcommandNames.get: {
        await this.get(i);
        break;
      }

      case SubcommandNames.add: {
        await this.add(i);
        break;
      }

      case SubcommandNames.remove: {
        await this.remove(i);
        break;
      }

      default: {
        this.logger.error(`Unknown subcommand: ${i.options.getSubcommand()}`);
        i.editReply('Unknown subcommand.');
      }
    }
  }

  private async search(i: CommandInteraction<CacheType>): Promise<void> {
    const query = i.options.getString('query', true);
    const sladders = await this.sladderRepository.find({
      where: { guild: i.guildEntity },
    });

    if (sladders.length === 0) {
      i.editReply(`No sladders found for "${query}".`);
      return;
    }

    const fuse = new Fuse(sladders, this.fuseOptions);

    const results = fuse.search(query);

    const embed = this.client
      .defaultEmbed()
      .setTitle(`Sladder search for "${query}"`)
      .setDescription(
        results.map(({ item }) => `${item.id}: ${item.content}`).join('\n')
      );

    i.editReply({ embeds: [embed] });
  }

  private async list(i: CommandInteraction<CacheType>): Promise<void> {
    const sladders = await this.sladderRepository.find({
      where: { guild: i.guildEntity },
      order: { id: 'ASC' },
    });

    if (sladders.length === 0) {
      i.editReply('No sladders found.');
      return;
    }

    const embed = this.client
      .defaultEmbed()
      .setTitle('Sladder list')
      .setDescription(
        sladders
          .map((sladder) => `\`${sladder.id}\`: ${sladder.content}`)
          .join('\n')
      );

    i.editReply({ embeds: [embed] });
  }

  private async get(i: CommandInteraction<CacheType>): Promise<void> {
    const id = i.options.getNumber(SubcommandArguments.id, true);
    const publicOption =
      i.options.getBoolean(SubcommandArguments.public, false) ?? false;

    const sladder = await this.sladderRepository.findOne({
      where: { id, guild: i.guildEntity },
    });

    if (!sladder) {
      i.editReply(`No sladder found for id \`${id}\`.`);
      return;
    }

    const embed = this.client
      .defaultEmbed()
      .setTitle(`Sladder \`${id}\``)
      .setDescription(sladder.content)
      .setFooter({
        text: `Called by ${i.user.tag}`,
        iconURL: i.user.avatarURL() ?? undefined,
      });

    if (publicOption) {
      if (!i.channel) {
        i.editReply('No channel to send the sladder to.');
        return;
      }

      i.channel
        .send({ embeds: [embed] })
        .then(() => {
          i.editReply(`Sladder sent to channel.`);
        })
        .catch(() => {
          i.editReply(`Failed to send sladder to channel.`);
        });
    } else {
      i.editReply({ embeds: [embed] });
    }
  }

  private async add(i: CommandInteraction<CacheType>): Promise<void> {
    const sladder = new Sladder({
      content: i.options.getString(SubcommandArguments.content, true),
      guild: i.guildEntity,
      userId: i.user.id,
    });

    await this.sladderRepository.save(sladder);

    i.editReply(`Sladder ${sladder.id} created.`);
  }

  private async remove(i: CommandInteraction<CacheType>): Promise<void> {
    i.editReply('fuck you ask the mods to remove it');
  }
}
