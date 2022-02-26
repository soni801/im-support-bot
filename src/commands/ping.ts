import Command, { CommandOptions } from '../util/Command';
import { Message } from 'discord.js';

export default class extends Command {
  config: CommandOptions = {
    name: 'ping',
    aliases: ['hello'],
    permissions: { bot: 'SEND_MESSAGES' },
    help: {
      shortDescription: 'Get current bot delay',
      description:
        'Gets the current bot delay. Useful for checking for slowness or discord API errors.',
      category: 'util',
    },
  };

  async run(message: Message, ..._: any) {
    const pre: number = Date.now();
    const msg = await message.reply('Pong!');
    await msg.edit(
      `:ping_pong: Websocket ping: ${this.client.ws.ping}ms | Bot latency: ${
        Date.now() - pre
      }ms`
    );
  }
}
