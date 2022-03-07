import { Message } from 'discord.js';
import { readdir } from 'fs/promises';
import { resolve } from 'path';
import Command, { CommandOptions } from '../util/Command';
import { confirmation, plural, wrapInlineCode } from '../util/misc';

export default class extends Command {
  config: CommandOptions = {
    name: 'reload',
    help: {
      shortDescription: 'Reloads a command',
      description:
        'Reloads a command. This is useful for fixing bugs or updating commands.',
      usage: '<command|--raw>',
    },
    level: 3,
  };

  async run(message: Message, ...args: string[]) {
    if (args.length === 0) {
      return message.reply('Please specify a command to reload.');
    }

    let commands: (Command | string)[] = [];
    switch (args[0]) {
      case '--raw': {
        const dir = './';
        commands = await readdir(resolve(__dirname, dir));
        break;
      }
      case 'all': {
        commands = Array.from(this.client.commands.values());
        break;
      }
      default: {
        for (const command of args) {
          const cmd = this.client.commands.find(
            (val) => val.config.name === command
          );

          if (cmd) commands.push(cmd);
        }
      }
    }

    if (commands.length === 0) {
      return message.reply('No commands found.');
    }

    const confirmationMsg = `Are you sure you would like to reload the following ${plural(
      commands.length,
      'command',
      'commands'
    )}:
${commands
  .map((cmd) => {
    let name: string;
    typeof cmd === 'string' ? (name = cmd) : (name = cmd.config.name);
    return `> ${wrapInlineCode(name)}`;
  })
  .join('\n')}`;

    const confirmed = await confirmation(message, confirmationMsg, {
      confirmMessage: 'Working...',
      denyMessage: 'Cancelled.',
      deleteButtons: true,
    });

    if (!confirmed) return;

    const finished: Command[] = [];
    for (const command of commands) {
      let filePath: string;

      if (command instanceof Command) {
        filePath = command.config.filePath ?? '';

        this.client.commands.delete(command.config.name);

        if (command.config.aliases) {
          for (const alias of command.config.aliases) {
            this.client.aliases.delete(alias);
          }
        }
      } else {
        filePath = resolve(__dirname, './', command);
      }

      delete require.cache[require.resolve(filePath)];

      const c: Command = new (await import(filePath)).default(this.client);
      c.config.filePath = filePath;
      finished.push(c);
      this.client.registerCommand(c);
    }

    message.channel.send(
      `Reloaded:
${finished
  .map(({ config: { name } }) => `> ${wrapInlineCode(name)}`)
  .join('\n')}`
    );

    return;
  }
}
