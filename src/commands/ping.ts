import Command, { CommandOptions } from '../util/Command';
import { EmbedFieldData, Message } from 'discord.js';

// https://stackoverflow.com/a/58826445/9088682
function timeConversion(duration: number) {
  const portions: string[] = [];

  const msInHour = 1000 * 60 * 60;
  const hours = Math.trunc(duration / msInHour);
  if (hours > 0) {
    portions.push(hours + 'h');
    duration = duration - hours * msInHour;
  }

  const msInMinute = 1000 * 60;
  const minutes = Math.trunc(duration / msInMinute);
  if (minutes > 0) {
    portions.push(minutes + 'm');
    duration = duration - minutes * msInMinute;
  }

  const seconds = Math.trunc(duration / 1000);
  if (seconds > 0) {
    portions.push(seconds + 's');
  }

  return portions.join(' ');
}

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
        value: `${timeConversion(statusData.uptime)}`,
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
