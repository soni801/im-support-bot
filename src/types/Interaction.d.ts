import {
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from '@discordjs/builders';
import { Client, CommandInteraction } from 'discord.js';

import Logger from '../util/Logger';

export abstract class Interaction {
  /**
   * The client that this interaction is attached to
   *
   * @type {Client}
   * @memberof Interaction
   */
  client: Client;

  /**
   * The logger for this interaction
   *
   * @type {Logger}
   * @memberof Interaction
   */
  logger: Logger;

  /**
   * Name of the interaction
   *
   * @type {string}
   * @memberof Interaction
   */
  name: string;

  constructor(client: Client);

  /**
   * The slash command builder for this interaction.
   *
   * @abstract
   * @return {(Promise<
   *     | SlashCommandBuilder
   *     | SlashCommandSubcommandsOnlyBuilder
   *     | SlashCommandSubcommandGroupBuilder
   *   >)}
   * @memberof Interaction
   */
  abstract slashCommand(): Promise<
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandSubcommandGroupBuilder
  >;

  /**
   * The entry point for this interaction.
   *
   * @abstract
   * @param {CommandInteraction} i The interaction object.
   * @return {Promise<void>} Is an async function.
   * @memberof Interaction
   */
  abstract execute(i: CommandInteraction): Promise<any>;
}
