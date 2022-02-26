import { Message } from 'discord.js';
import Command, { CommandOptions } from '../util/Command';
import Logger from '../util/Logger';
import { confirmation } from '../util/misc';

export default class restart extends Command {
  config: CommandOptions = {
    name: 'restart',
    aliases: ['reboot'],
    level: 3,
  };

  logger = new Logger(restart.name);

  async run(message: Message, ...arg: string[]) {
    this.logger.warn(`Restart initiated by ${message.author.tag}`);

    if (arg.length > 0 && arg[0] === '--force') {
      await message.channel.send('Restarting...');
    } else {
      const question =
        ':warning: Are you sure you would like to restart the bot? (Confirm within 5 seconds)';
      const yes = 'Restarting...';
      const no = 'Restart cancelled.';

      const conf = await confirmation(message, question, {
        confirmMessage: yes,
        denyMessage: no,
        deleteButtons: true,
        timeout: 5000,
      });

      if (!conf) return;
    }

    this.logger.error(
      `Restart command used by ${message.author.tag} on ${new Date()}`
    );

    this.client.emit('restart', message);
  }
}
