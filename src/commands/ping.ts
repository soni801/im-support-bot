import Command, { CommandOptions } from '../util/Command';
import { EmbedFieldData, Message } from 'discord.js';

export default class extends Command {
  config: CommandOptions = {
    name: 'ping',
    aliases: ['hello', 'status'],
    permissions: { bot: ['SEND_MESSAGES'] },
    help: {
      shortDescription: 'Get current bot delay',
      description:
        'Gets the current bot delay. Useful for checking for slowness or discord API errors.',
    },
  };

  async run(message: Message, ..._: any) {
    const pre: number = Date.now();

    const statusData = await this.client.getStats();

    const fields: EmbedFieldData[] = [
      {
        name: 'WebSocket',
        value: `${this.client.ws.ping}ms`,
        inline: true,
      },
      {
        name: 'API',
        value: `${Date.now() - pre}ms`,
        inline: true,
      },
      {
        name: 'Uptime',
        value: `${statusData.uptime}ms`,
        inline: true,
      },
      {
        name: 'Guilds',
        value: `${statusData.guilds}`,
        inline: true,
      },
      {
        name: 'Users',
        value: `${statusData.users}`,
        inline: true,
      },
      {
        name: 'Channels',
        value: `${statusData.channels}`,
        inline: true,
      },
    ];

    const embed = this.client.defaultEmbed().setTitle('Pong!');
    embed.setFields(fields);

    const msg = await message.reply({ embeds: [embed] });

    fields[1].value = `${Date.now() - pre}ms`;

    embed.setFields(fields);

    await msg.edit({ embeds: [embed] });
  }
}
