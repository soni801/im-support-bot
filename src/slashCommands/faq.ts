import { SlashCommandBuilder } from '@discordjs/builders';
import axios from 'axios';

import type { ApiFaqResponse } from '../types/faq';
import { StringOptions } from '../types/slashcommand';

export async function getFaq() {
  return axios
    .get<ApiFaqResponse[]>('https://help.yessness.com/assets/json/faq.json')
    .then((response) => response.data);
}

export default async function () {
  const faqGetChoices: StringOptions[] = await getFaq().then((data) =>
    data.map(({ question }, index) => [question, index.toString()])
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
