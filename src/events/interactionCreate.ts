import type { GuildMember, Interaction } from 'discord.js';
import { event } from '../types/event';
import Client from '../util/Client';

const interactionCreate: event<'interactionCreate'> = async (
  client: Client,
  i: Interaction
) => {
  if (i.isApplicationCommand() && i.isCommand()) {
    client.logger.info(
      `Slash command ${i.commandName} called by ${
        (i.member as GuildMember).user.tag
      }`
    );

    await i.deferReply({ ephemeral: true });

    switch (i.commandName) {
      case 'faq': {
        await client.slashCommands.get('faq')?.execute(i);
        break;
      }

      case 'ticket': {
        await client.slashCommands.get('ticket')?.execute(i);
        break;
      }

      default: {
        await i.editReply("Not implemented or doesn't exist.");
        break;
      }
    }
  }
};

export default interactionCreate;
