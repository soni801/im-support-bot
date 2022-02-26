import Command, { CommandOptions } from '../util/Command';
import { getLevel } from '../util/misc';
import { CONSTANTS } from '../util/config';
import { Collection, GuildMember, Message } from 'discord.js';

export default class extends Command {
  config: CommandOptions = {
    name: 'help',
    permissions: { bot: ['EMBED_LINKS', 'SEND_MESSAGES'] },
    help: {
      shortDescription: 'Get a list of commands',
      description: 'Gets a list of commands the current user can run.',
      category: 'util',
      usage: '[command]',
    },
  };

  async run(message: Message, ...args: string[]) {
    let embed = this.client.defaultEmbed();

    if (args.length === 0) {
      const commands = this.client.commands.filter(
        (command) => !command.config?.help?.hidden
      );
      const categories = new Collection<string, Command[]>();

      const userLevel = await getLevel(message.member as GuildMember);

      if (userLevel == 3) {
        categories.set(
          'bot owners',
          Array.from(
            commands.filter((command) => command.config?.level === 3).values()
          )
        );
      }

      if (userLevel >= 2) {
        categories.set(
          'admins',
          Array.from(
            commands.filter((command) => command.config?.level === 2).values()
          )
        );
      }

      if (userLevel >= 1) {
        categories.set(
          'other',
          Array.from(
            commands.filter((command) => command.config?.level === 1).values()
          )
        );
      }

      categories.set(
        'no level',
        Array.from(commands.filter((command) => !command.config.level).values())
      );
      embed = this.client.defaultEmbed().setTitle('Help menu');

      for (const [category, _commands] of categories) {
        if (_commands.length === 0) continue;

        const commandList: Array<string> = [];
        for (const command of _commands) {
          commandList.push(
            `\`${command.config.name}\`${
              command.config.disabled ? ' **(Disabled)**' : ''
            } - ${
              command.config?.help?.shortDescription
                ? command.config.help.shortDescription
                : 'No short description configured'
            }`
          );
        }
        embed.addField(
          category.charAt(0).toLocaleUpperCase() + category.slice(1),
          `- ${commandList.join('\n- ')}`
        );
      }

      return message.reply({ embeds: [embed] });
    } else {
      const command = this.client.commands.get(args[0] ?? '');

      if (!command) {
        return message.reply({
          embeds: [
            embed
              .setDescription(':warning: Command not found')
              .setColor(CONSTANTS.COLORS.warning),
          ],
        });
      }

      const title = `\`${command.config.name}\`${
        command.config.disabled ? ' (Disabled)' : ''
      }`;

      let description = '';

      if (command.config?.help?.category)
        description += `\nCategory: ${command.config.help.category}`;
      if (command.config?.help?.usage)
        description += `\nUsage: \`${command.config.name} ${command.config.help.usage}\``;
      if (command.config.aliases)
        description += `\nAliases: ${command.config.aliases.join(', ')}`;
      if (command.config.level)
        description += `\nMinimum level: ${command.config.level}`;
      if (command.config.permissions) {
        description += '\nRequired permissions:';

        if (command.config.permissions.bot)
          description += `\n- Bot permission requirements: ${(
            command.config.permissions.bot as Array<string>
          ).join(', ')}`;
        if (command.config.permissions.user)
          description += `\n- User permission requirements: ${(
            command.config.permissions.user as Array<string>
          ).join(', ')}`;
      }

      if (command.config?.help?.description)
        description += `\n\n${command.config.help.description}`;

      embed
        .setDescription(
          description.length > 0
            ? description
            : 'No params or help stuff added to command'
        )
        .setTitle(title);

      return message.channel.send({ embeds: [embed] });
    }
  }
}
