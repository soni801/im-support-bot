import {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandSubcommandGroupBuilder,
} from '@discordjs/builders';
import axios from 'axios';
import { CommandInteraction, CacheType } from 'discord.js';
import { PrivateLeaderboard } from '../types/adventofcode';
import { Interaction } from '../types/Interaction';
import Client from '../util/Client';
import { CONSTANTS } from '../util/config';
import Logger from '../util/Logger';
import { plural } from '../util/misc';

export default class AoC implements Interaction {
  client: Client;
  logger = new Logger(AoC.name);
  name = 'aoc';

  constructor(client: Client) {
    this.client = client;
  }

  async slashCommand(): Promise<
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandSubcommandGroupBuilder
  > {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Commands related to Advent of Code')
      .addSubcommand((subcommand) =>
        subcommand.setName('leaderboard').setDescription('Some description')
      );
  }

  async execute(i: CommandInteraction<CacheType>): Promise<any> {
    const leaderboard = await AoC.getLeaderboard();

    const description = Object.values(leaderboard.members)
      .sort((m1, m2) => m2.stars - m1.stars)
      .map(
        (val, index) =>
          `${index + 1}: ${val.name} - ${val.stars} ${plural(
            val.stars,
            'star',
            'stars'
          )}`
      )
      .join('\n');

    const embed = this.client
      .defaultEmbed()
      .setTitle('Advent of Code leaderboard')
      .setDescription(description);

    i.editReply({ embeds: [embed] });
  }

  static async getLeaderboard() {
    return axios
      .get<PrivateLeaderboard>(
        `https://adventofcode.com/2022/leaderboard/private/view/${CONSTANTS.aocLeaderboardId}.json`,
        {
          headers: {
            Cookie: `session=${CONSTANTS.aocSessionCookie};`,
          },
          withCredentials: true,
        }
      )
      .then((res) => res.data);
  }
}
