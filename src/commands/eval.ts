import { Message, MessageEmbed } from 'discord.js';
import { inspect } from 'util';
import Command, { CommandOptions } from '../util/Command';
import Logger from '../util/Logger';
import { clean, parseCodeblock, wrapCodeblock } from '../util/misc';

export default class extends Command {
  config: CommandOptions = {
    name: 'eval',
    aliases: ['ev'],
    help: {
      hidden: true,
    },
    level: 3,
  };

  logger = new Logger('eval');

  async run(message: Message, ...args: string[]) {
    const startTime: number = Date.now();
    let code = parseCodeblock(args.join(' '));

    let embed: MessageEmbed = this.client.defaultEmbed();

    try {
      let evaled = await eval(code);

      if (typeof evaled !== 'string') {
        evaled = inspect(evaled);
      }

      /* This checks if the input and output are over 1024 characters long
            (1016 characters with codeblock), and if so, it replaces them,
            in order to prevent the embed from raising an uncaught exception. */
      if (code.length > 1016) {
        code =
          '"The input cannot be displayed as it is longer than 1024 characters."';
      }
      if (evaled.length > 1016) {
        console.log('Eval Output:\n', clean(evaled));
        evaled =
          '"The output cannot be displayed as it is longer than 1024 characters. Please check the console."';
      }

      embed = embed
        .setColor('GREEN')
        .setTitle('Evaluation Successful')
        .addFields(
          { name: '📥 Input', value: wrapCodeblock(code) },
          { name: '📤 Output', value: wrapCodeblock(clean(evaled)) }
        );
    } catch (error: any) {
      this.logger.error('Eval error:');
      console.error(error);

      embed = embed
        .setColor('RED')
        .setTitle('Evaluation Error')
        .addFields(
          { name: '📥 Input', value: wrapCodeblock(code) },
          {
            name: '❌ Error message',
            value: wrapCodeblock(error.message),
          }
        );
    } finally {
      embed = embed.setTimestamp().setFooter({
        text: `Execution time: ${Math.round(Date.now() - startTime)}ms`,
        iconURL: this.client.user.displayAvatarURL({ format: 'png' }),
      });

      message.channel.send({ embeds: [embed] });
    }
  }
}
