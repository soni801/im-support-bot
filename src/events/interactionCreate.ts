import { Interaction } from 'discord.js';
import { handleFaqInteraction } from '../slashCommands/faq';
import { handleTicketInteraction } from '../slashCommands/ticket';
import { event } from '../types/event';
import Client from '../util/Client';

const interactionCreate: event<'interactionCreate'> = async (
  client: Client,
  i: Interaction
) => {
  if (!i.isCommand()) return;

  if (i.isApplicationCommand()) {
    await i.deferReply({ ephemeral: true });

    switch (i.commandName) {
      case 'faq': {
        await handleFaqInteraction(client, i);
        break;
      }

      case 'ticket': {
        await handleTicketInteraction(client, i);
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
