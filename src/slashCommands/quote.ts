import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, CacheType } from 'discord.js';
import { Repository } from 'typeorm';
import Fuse from 'fuse.js';
import { Quote } from '../entities/Quote.entity';
import Guild from '../entities/Guild.entity';
import { Interaction } from '../types/Interaction';
import Client from '../util/Client';
import Logger from '../util/Logger';
import { CONSTANTS } from '../util/config';

export enum SubcommandNames {
  list = 'list',
  get = 'get',
  search = 'search',
  add = 'add',
  remove = 'remove',
  getRandom = 'getrandom',
}

export enum SubcommandArguments {
  id = 'id',
  public = 'public',
  content = 'content',
  query = 'query',
  quotedUser = 'quoted_user',
}

export default class SlashQuote implements Interaction {
  client: Client;
  logger: Logger = new Logger(SlashQuote.name);
  name = 'quote';

  quoteRepository: Repository<Quote>;
  guildRepository: Repository<Guild>;

  fuseOptions: Fuse.IFuseOptions<Quote> = {
    keys: ['content', 'id'],
    threshold: 0.3,
  };

  constructor(client: Client) {
    this.client = client;

    this.quoteRepository = client.db.getRepository(Quote);
    this.guildRepository = client.db.getRepository(Guild);
  }

  async slashCommand() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Quote commands for all your quote needs.')
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.search)
          .setDescription('Search all the local quotes.')
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
          .setDescription('List all the local quotes.')
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.get)
          .setDescription('Get a specific quote.')
          .addNumberOption((input) =>
            input
              .setName(SubcommandArguments.id)
              .setRequired(true)
              .setDescription('The id of the quote to get.')
          )
          .addBooleanOption((input) =>
            input
              .setName(SubcommandArguments.public)
              .setDescription(
                'Send the quote to the channel and not just reply to the slash command'
              )
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.getRandom)
          .setDescription('Get a random quote.')
          .addBooleanOption((input) =>
            input
              .setName(SubcommandArguments.public)
              .setDescription(
                'Send the quote to the channel and not just reply to the slash command'
              )
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.add)
          .setDescription('Create a new quote.')
          .addStringOption((input) =>
            input
              .setName(SubcommandArguments.content)
              .setDescription('Quote quote')
              .setRequired(true)
          )
          .addUserOption((input) =>
            input
              .setName(SubcommandArguments.quotedUser)
              .setDescription('Who said it?')
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.remove)
          .setDescription('Remove a quote.')
          .addNumberOption((input) =>
            input
              .setName(SubcommandArguments.id)
              .setRequired(true)
              .setDescription('The id of the quote to remove.')
          )
      );
  }

  public async execute(i: CommandInteraction<CacheType>): Promise<void> {
    try {
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

        case SubcommandNames.getRandom: {
          await this.getRandom(i);
          break;
        }

        default: {
          this.logger.error(`Unknown subcommand: ${i.options.getSubcommand()}`);
          i.editReply(CONSTANTS.ERRORS.UNKNOWN_SUBCOMMAND);
        }
      }
    } catch (e) {
      // Reject it so it can be caught higher up
      Promise.reject(e);
    }
  }

  private async search(i: CommandInteraction<CacheType>): Promise<void> {
    const query = i.options.getString('query', true);
    const quotes = await this.quoteRepository.find({
      where: { guild: i.guildEntity },
    });

    if (quotes.length === 0) {
      i.editReply(`No quotes found for "${query}".`);
      return;
    }

    const fuse = new Fuse(quotes, this.fuseOptions);

    const results = fuse.search(query);

    const embed = this.client
      .defaultEmbed()
      .setTitle(`Quote search for "${query}"`)
      .setDescription(
        results.map(({ item }) => `${item.id}: ${item.content}`).join('\n')
      );

    i.editReply({ embeds: [embed] });
  }

  private async list(i: CommandInteraction<CacheType>): Promise<void> {
    const quotes = await this.quoteRepository.find({
      where: { guild: i.guildEntity },
      order: { id: 'ASC' },
    });

    if (quotes.length === 0) {
      i.editReply('No quotes found.');
      return;
    }

    const embed = this.client
      .defaultEmbed()
      .setTitle('Quote list')
      .setDescription(
        quotes.map((quote) => `\`${quote.id}\`: ${quote.content}`).join('\n')
      );

    i.editReply({ embeds: [embed] });
  }

  private async get(i: CommandInteraction<CacheType>): Promise<void> {
    const id = i.options.getNumber(SubcommandArguments.id, true);
    const publicOption =
      i.options.getBoolean(SubcommandArguments.public, false) ?? false;

    const quote = await this.quoteRepository.findOne({
      where: { id, guild: i.guildEntity },
    });

    if (!quote) {
      i.editReply(`No quote found for id \`${id}\`.`);
      return;
    }

    const quoter = this.client.users.cache.get(quote.userId)?.tag;
    const embed = this.client
      .defaultEmbed()
      .setTitle(`Quote \`${id}\``)
      .setDescription(
        `${quote.content}
- <@${quote.quotedUserId}>, <t:${Math.round(
          quote.createdAt.getTime() / 1000
        )}:R>`
      )
      .setFooter({
        text: `Called by ${i.user.tag}${quoter ? `, Quoted by ${quoter}` : ''}`,
        iconURL: i.user.avatarURL() ?? undefined,
      });

    if (publicOption) {
      if (!i.channel) {
        i.editReply('No channel to send the quote to.');
        return;
      }

      i.channel
        .send({ embeds: [embed] })
        .then(() => {
          i.editReply(`Quote sent to channel.`);
        })
        .catch(() => {
          i.editReply(`Failed to send quote to channel.`);
        });
    } else {
      i.editReply({ embeds: [embed] });
    }
  }

  private async add(i: CommandInteraction<CacheType>): Promise<void> {
    const quote = new Quote({
      content: i.options.getString(SubcommandArguments.content, true),
      guild: i.guildEntity,
      userId: i.user.id,
      quotedUserId: i.options.getUser(SubcommandArguments.quotedUser, true).id,
    });

    await this.quoteRepository.save(quote);

    i.editReply(`Quote ${quote.id} created.`);
  }

  private async remove(i: CommandInteraction<CacheType>): Promise<void> {
    i.editReply('fuck you ask the mods to remove it');
  }

  private async getRandom(i: CommandInteraction<CacheType>): Promise<any> {
    const pub =
      i.options.getBoolean(SubcommandArguments.public, false) ?? false;

    const quotes = await this.quoteRepository.find({
      where: { guild: i.guildEntity },
    });

    if (quotes.length === 0) {
      return i.editReply('No quotes found.');
    }

    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    const quoter = this.client.users.cache.get(quote.userId)?.tag;
    const embed = this.client
      .defaultEmbed()
      .setTitle(`Quote \`${quote.id}\``)
      .setDescription(
        `${quote.content}
- <@${quote.quotedUserId}>, <t:${Math.round(
          quote.createdAt.getTime() / 1000
        )}:R>`
      )
      .setFooter({
        text: `Called by ${i.user.tag}${quoter ? `, Quoted by ${quoter}` : ''}`,
        iconURL: i.user.avatarURL() ?? undefined,
      });

    if (pub) {
      if (!i.channel) {
        i.editReply('No channel to send the quote to.');
        return;
      }

      i.channel
        .send({ embeds: [embed] })
        .then(() => {
          i.editReply(`Quote sent to channel.`);
        })
        .catch(() => {
          i.editReply(`Failed to send quote to channel.`);
        });
    } else {
      i.editReply({ embeds: [embed] });
    }
  }
}
