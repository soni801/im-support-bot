import {
  Interaction,
  Message,
  MessageActionRow,
  MessageSelectMenu,
  MessageSelectOptionData,
} from 'discord.js';
import TurndownService from 'turndown';
import { getFaq } from '../slashCommands/faq';
import { event } from '../types/event';
import Client from '../util/Client';

const interactionCreate: event<'interactionCreate'> = async (
  client: Client,
  i: Interaction
) => {
  const turndownService = new TurndownService();

  if (!i.isCommand()) return;

  if (i.isApplicationCommand()) {
    await i.deferReply({ ephemeral: true });

    switch (i.commandName) {
      case 'faq': {
        switch (i.options.getSubcommand()) {
          case 'list': {
            const faq = await getFaq();

            const embed = client
              .defaultEmbed()
              .setTitle('FAQ')
              .setDescription(
                faq
                  .map(({ question }, index) => `${index + 1}. ${question}`)
                  .join('\n')
              );

            // Create a select menu for the user to select a question, and then edit the embed to show the answer.
            const selectMenu = [
              new MessageActionRow().addComponents(
                new MessageSelectMenu().setCustomId('faq').setOptions(
                  faq.map(
                    ({ question }, index): MessageSelectOptionData => ({
                      label: `${index + 1}. ${question}`,
                      value: index.toString(),
                    })
                  )
                )
              ),
            ];

            const msg = await i.editReply({
              embeds: [embed],
              components: selectMenu,
            });

            if (!(msg instanceof Message)) return;

            const collector = msg.createMessageComponentCollector({
              time: 10 * 60 * 1000, // 10 minutes
            });

            collector.on('collect', async (int) => {
              if (!int.isSelectMenu()) return;

              int.deferUpdate();

              const faq = await getFaq();

              const answer = faq[parseInt(int.values[0])];

              embed.setDescription(
                `**${answer.question}**\n` +
                  turndownService.turndown(answer.answer)
              );

              await i.editReply({ embeds: [embed] });
            });

            collector.on('end', async () => {
              msg.edit({ components: [] });
            });

            break;
          }

          default: {
            await i.editReply("Not implemented or doesn't exist.");
            break;
          }
        }
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
