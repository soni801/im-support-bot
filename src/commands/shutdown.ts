import { Message } from 'discord.js';
import Command, { CommandOptions } from '../util/Command';
import { CONSTANTS } from '../util/config';
import Logger from '../util/Logger';
import { confirmation } from '../util/misc';

export default class shutdown extends Command {
  config: CommandOptions = {
    name: 'shutdown',
    aliases: ['stop'],
    permissions: { bot: ['SEND_MESSAGES'] },
    help: {
      shortDescription: 'Stops the bot',
      description: 'Stops the bot, and exits the process.',
    },
    level: 3,
  };

  logger = new Logger(shutdown.name);

  async run(message: Message, ..._: string[]) {
    this.logger.warn(`Shutdown initiated by ${message.author.tag}`);

    const question =
      ':warning: Are you sure you would like to stop the bot? (Confirm within 5 seconds)';
    const yes = 'Shutting down...';
    const no = 'Shutdown cancelled.';

    const conf = await confirmation(message, question, {
      confirmMessage: yes,
      denyMessage: no,
      deleteButtons: true,
      timeout: 5000,
    });

    if (!conf) return;

    this.logger.error(CONSTANTS.ERRORS.SHUTDOWN_USED(message.author));

    this.client.destroy();

    this.logger.error(CONSTANTS.ERRORS.CLIENT_DESTROY);
    process.exit(0);
  }
}
