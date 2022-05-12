import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageSelectMenu,
  MessageSelectOptionData,
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import axios from 'axios';
import TurndownService from 'turndown';
import Fuse from 'fuse.js';
import type { APIApplicationCommandOptionChoice } from 'discord-api-types/v10';

import type { ApiFaqResponse } from '../types/faq';
import type { Interaction } from '../types/Interaction';
import { INTERACTION_IDS } from '../util/IDs';
import Client from '../util/Client';
import Logger from '../util/Logger';

export enum SubcommandNames {
  list = 'list',
  get = 'get',
  search = 'search',
}

export enum OptionNames {
  question = 'question',
  query = 'query',
}

export default class SlashFaq implements Interaction {
  client: Client;
  logger = new Logger(SlashFaq.name);
  name = 'faq';

  turndownService = new TurndownService();
  fuseOptions: Fuse.IFuseOptions<ApiFaqResponse> = {
    keys: ['question', 'answer'],
    threshold: 0.3,
  };

  constructor(client: Client) {
    this.client = client;
  }

  async slashCommand() {
    const faqGetChoices: APIApplicationCommandOptionChoice<string>[] =
      await SlashFaq.getFaq().then((data) => SlashFaq.faqDiscordFormat(data));

    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Get a list of frequently asked questions.')
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.list)
          .setDescription('Get a list of frequently asked questions.')
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.get)
          .setDescription('Get a specific question.')
          .addStringOption((input) =>
            input
              .setName(OptionNames.question)
              .setRequired(true)
              .setDescription('The question to get.')
              .setChoices(...faqGetChoices)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.search)
          .setDescription('Search for a question.')
          .addStringOption((input) =>
            input
              .setName(OptionNames.query)
              .setRequired(true)
              .setDescription('The query to search for.')
          )
      );
  }

  public async execute(i: CommandInteraction) {
    switch (i.options.getSubcommand()) {
      case SubcommandNames.list: {
        await this.list(i);
        break;
      }

      case SubcommandNames.get: {
        await this.get(i);
        break;
      }

      case SubcommandNames.search: {
        await this.search(i);
        break;
      }

      default: {
        await i.editReply("Not implemented or doesn't exist.");
        break;
      }
    }
  }

  static async getFaq() {
    return axios
      .get<ApiFaqResponse[]>('https://help.yessness.com/assets/json/faq.json')
      .then((response) => response.data);
  }

  static faqDiscordFormat(data: ApiFaqResponse[]) {
    return data.map(
      ({ question }, index): APIApplicationCommandOptionChoice<string> => ({
        name: question,
        value: index.toString(),
      })
    );
  }

  async list(i: CommandInteraction) {
    const faq = await SlashFaq.getFaq();

    const embed = this.client
      .defaultEmbed()
      .setTitle('FAQ')
      .setDescription(
        faq.map(({ question }, index) => `${index + 1}. ${question}`).join('\n')
      );

    // Create a select menu for the user to select a question, and then edit the embed to show the answer.
    const selectMenu = [
      new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setOptions(
            faq.map(
              ({ question }, index): MessageSelectOptionData => ({
                label: `${index + 1}. ${question}`,
                value: index.toString(),
              })
            )
          )
          .setPlaceholder('Select a question')
          .setCustomId(INTERACTION_IDS.FAQ_SELECT)
      ),
    ];

    const msg = await i.editReply({
      embeds: [embed],
      components: selectMenu,
    });

    if (!(msg instanceof Message)) return;

    const collectDuration = 10 * 60 * 1000;

    const collector = msg.createMessageComponentCollector({
      time: collectDuration,
    });

    collector
      .on('collect', async (int) => {
        if (!int.isSelectMenu()) return;

        int.deferUpdate();

        const faq = await SlashFaq.getFaq();

        const answer = faq[parseInt(int.values[0])];

        embed.setDescription(
          `**${answer.question}**\n` +
            this.turndownService.turndown(answer.answer)
        );

        await i.editReply({ embeds: [embed] });
      })
      .on('end', async () => {
        i.editReply({
          components: [],
        }).catch((e: Error) => {
          this.logger.info(
            `Error while editing FAQ message - ${e.name}: ${e.message}`
          );

          console.debug(JSON.stringify(e));
        });
      });
  }

  async get(i: CommandInteraction) {
    const faq = await SlashFaq.getFaq();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const question = i.options.getString(OptionNames.question)!;

    const answer = faq[parseInt(question)];

    if (!answer) {
      await i.editReply('No question found.');
      return;
    }

    const embed = this.client
      .defaultEmbed()
      .setTitle('FAQ')
      .setDescription(
        `**${answer.question}**\n` +
          this.turndownService.turndown(answer.answer)
      );

    await i.editReply({ embeds: [embed] });
  }

  async search(i: CommandInteraction) {
    const faq = await SlashFaq.getFaq();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const query = i.options.getString(OptionNames.query)!;

    const fuse = new Fuse(faq, this.fuseOptions);
    const results = fuse.search(query);

    if (results.length === 0) {
      await i.editReply('No results found.');
      return;
    }

    const embed = this.client
      .defaultEmbed()
      .setTitle('FAQ Search')
      .setDescription(
        `**${results.length}** results found for **"${query}"**\n\n` +
          results
            .map(({ item }, index) => `${index + 1}. ${item.question}`)
            .join('\n')
      );

    // Create a select menu for the user to select a question, and then edit the embed to show the answer.
    const selectMenu = [
      new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setOptions(
            results.map(
              ({ item }, index): MessageSelectOptionData => ({
                label: `${index + 1}. ${item.question}`,
                value: faq.findIndex((faq) => faq === item).toString(),
              })
            )
          )
          .setPlaceholder('Select a question')
          .setCustomId(INTERACTION_IDS.FAQ_SELECT)
      ),
    ];

    const msg = await i.editReply({
      embeds: [embed],
      components: selectMenu,
    });

    if (!(msg instanceof Message)) return;

    const collectDuration = 10 * 60 * 1000;

    const collector = msg.createMessageComponentCollector({
      time: collectDuration,
    });

    collector
      .on('collect', async (int) => {
        if (!int.isSelectMenu()) return;

        int.deferUpdate();

        const faq = await SlashFaq.getFaq();

        const answer = faq[parseInt(int.values[0])];

        embed.setDescription(
          `**${answer.question}**\n` +
            this.turndownService.turndown(answer.answer)
        );

        await i.editReply({ embeds: [embed] });
      })
      .on('end', async () => {
        i.editReply({
          components: [],
        }).catch((e: Error) => {
          this.logger.info(
            `Error while editing FAQ message - ${e.name}: ${e.message}`
          );

          console.debug(JSON.stringify(e));
        });
      });
  }
}
