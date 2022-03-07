import { Message } from 'discord.js';
import Command, { CommandOptions } from '../util/Command';

export default class extends Command {
  config: CommandOptions = {
    name: 'commands',
    aliases: ['listcommands', 'commandlist'],
    permissions: {
      bot: ['EMBED_LINKS', 'SEND_MESSAGES'],
    },
    help: {
      shortDescription: 'Get a list of commands',
      description:
        'Gets a list of all commands currently registered with the bot.',
      category: 'other',
    },
  };

  async run(msg: Message<boolean>, ..._: any): Promise<any> {
    const embed = this.client
      .defaultEmbed()
      .setTitle('Here is a list of my commands:')
      .setDescription(
        this.client.commands.map((c) => c.config.name).join('\n')
      );
    return await msg.reply({ embeds: [embed] });
  }
}
