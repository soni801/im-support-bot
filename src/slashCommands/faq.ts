import { SlashCommandBuilder } from '@discordjs/builders';
import axios from 'axios';
import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageSelectMenu,
  MessageSelectOptionData,
} from 'discord.js';
import TurndownService from 'turndown';

import type { ApiFaqResponse } from '../types/faq';
import { StringOptions } from '../types/slashcommand';
import Client from '../util/Client';
import INTERACTION_IDS from '../util/INTERACTION_IDS';
import Logger from '../util/Logger';

export async function getFaq() {
  return axios
    .get<ApiFaqResponse[]>('https://help.yessness.com/assets/json/faq.json')
    .then((response) => response.data);
}

export function faqDiscordFormat(data: ApiFaqResponse[]) {
  return data.map(
    ({ question }, index): StringOptions => [question, index.toString()]
  );
}

export default async function () {
  const faqGetChoices: StringOptions[] = await getFaq().then((data) =>
    faqDiscordFormat(data)
  );

  return new SlashCommandBuilder()
    .setName('faq')
    .setDescription('Get a list of frequently asked questions.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('Get a list of frequently asked questions.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('get')
        .setDescription('Get a specific question.')
        .addStringOption((input) =>
          input
            .setName('question')
            .setRequired(true)
            .setDescription('The question to get.')
            .setChoices(faqGetChoices)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('search')
        .setDescription('Search for a question.')
        .addStringOption((input) =>
          input
            .setName('query')
            .setRequired(true)
            .setDescription('The query to search for.')
        )
    );
}

export async function handleFaqInteraction(
  client: Client,
  i: CommandInteraction
) {
  const turndownService = new TurndownService();
  const faq = await getFaq();

  const logger = new Logger('faqInteraction');

  switch (i.options.getSubcommand()) {
    case 'list': {
      const embed = client
        .defaultEmbed()
        .setTitle('FAQ')
        .setDescription(
          faq
            .map(({ question }, index) => `${index + 1}. ${question}`)
            .join('\n')
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

          const faq = await getFaq();

          const answer = faq[parseInt(int.values[0])];

          embed.setDescription(
            `**${answer.question}**\n` + turndownService.turndown(answer.answer)
          );

          await i.editReply({ embeds: [embed] });
        })
        .on('end', async () => {
          i.editReply({
            components: [],
          }).catch((e: Error) => {
            logger.info(
              `Error while editing FAQ message - ${e.name}: ${e.message}`
            );

            console.debug(JSON.stringify(e));
          });
        });

      break;
    }

    case 'get': {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const question = i.options.getString('question')!;

      const answer = faq[parseInt(question)];

      if (!answer) {
        await i.editReply('No question found.');
        return;
      }

      const embed = client
        .defaultEmbed()
        .setTitle('FAQ')
        .setDescription(
          `**${answer.question}**\n` + turndownService.turndown(answer.answer)
        );

      await i.editReply({ embeds: [embed] });
      break;
    }

    default: {
      await i.editReply("Not implemented or doesn't exist.");
      break;
    }
  }
}
