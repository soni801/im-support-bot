import {
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageSelectMenu,
} from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

import Command, { CommandOptions } from '../util/Command';
import Logger from '../util/Logger';
import { token } from '../util/config';

export default class deploy extends Command {
  config: CommandOptions = {
    name: 'deploy',
    level: 3,
    help: {
      hidden: true,
    },
  };

  logger = new Logger(deploy.name);

  async run(message: Message, ..._: string[]) {
    if (!this.client.admins.has(message.author.id)) {
      return message.reply("You don't have permission to use this command.");
    }

    const embedField: EmbedFieldData = {
      name: 'Slash Commands',
      value: 'none',
    };

    const embed = this.client
      .defaultEmbed()
      .setTitle('Deploying...')
      .setDescription('Select slash commands to deploy (timeout in 30 seconds)')
      .setFields([embedField])
      .setTimestamp();

    const slashCommands = this.client.slashCommands.map((builder) => ({
      label: builder.name,
      description: builder.description,
      value: builder.name,
    }));

    const slashCommandsToDeploy: {
      deploy: boolean;
      command: string;
    }[] = this.client.slashCommands.map((builder) => ({
      deploy: false,
      command: builder.name,
    }));

    const actions = [
      new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId('slashcommands')
          .setPlaceholder('Slash Commands')
          .setOptions(slashCommands)
          .setCustomId('slashCommands')
      ),
      new MessageActionRow().addComponents(
        new MessageButton()
          .setEmoji('✅')
          .setLabel('Deploy')
          .setStyle('PRIMARY')
          .setCustomId('deploy'),
        new MessageButton()
          .setEmoji('❌')
          .setLabel('Cancel')
          .setStyle('SECONDARY')
          .setCustomId('cancel'),
        new MessageButton()
          .setEmoji('🔁')
          .setLabel('Reset')
          .setStyle('SECONDARY')
          .setCustomId('reset')
      ),
    ];

    const msg = await message.channel.send({
      embeds: [embed],
      components: actions,
    });

    const collector = msg.createMessageComponentCollector({});

    await new Promise<MessageComponentInteraction>((resolve, reject) => {
      collector.on('collect', async (i) => {
        await i.deferUpdate();

        switch (i.customId) {
          case 'deploy':
            resolve(i);
            break;
          case 'cancel':
            collector.stop();
            reject(i);
            break;
          case 'reset':
            slashCommandsToDeploy.forEach((c) => (c.deploy = false));
            embedField.value = 'none';
            break;
          case 'slashCommands': {
            if (!i.isSelectMenu()) break;

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const command = slashCommandsToDeploy.find(
              (c) => c.command === i.values[0]
            )!;

            command.deploy = !command.deploy;

            break;
          }
        }

        embedField.value = slashCommandsToDeploy
          .filter((c) => c.deploy)
          .map((builder) => builder.command)
          .join(', ');

        if (embedField.value === '') embedField.value = 'none';

        embed.setFields([embedField]);

        await msg.edit({ embeds: [embed] });
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          reject(null);
        }
      });
    })
      .then(async (i) => {
        if (slashCommandsToDeploy.filter((c) => c.deploy).length === 0) {
          embed
            .setDescription('No slash commands selected.')
            .setColor('YELLOW')
            .setFields([]);
        } else {
          const rest = new REST().setToken(token as string);

          await rest
            .put(
              Routes.applicationGuildCommands(
                this.client.application.id,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                message.guild!.id
              ),
              {
                body: this.client.slashCommands.filter(
                  (v) =>
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    slashCommandsToDeploy.find((c) => c.command === v.name)!
                      .deploy
                ),
              }
            )
            .then((res) => {
              embed
                .setDescription('Successfully deployed commands.')
                .setColor('GREEN');
              this.logger.debug(JSON.stringify(res));
            })
            .catch((err) => {
              console.error(err);
              embed.setDescription('Failed to deploy!').setColor(0xff0000);
            });
        }
      })
      .catch(() => {
        embed.setDescription('Deploy cancelled').setFields([]).setColor('RED');
      })
      .finally(() => {
        msg.edit({ embeds: [embed], components: [] });
      });

    return;
  }
}
