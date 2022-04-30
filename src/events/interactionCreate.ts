import type { GuildMember, Interaction } from 'discord.js';
import Guild from '../entities/Guild.entity';
import { event } from '../types/event';
import Client from '../util/Client';
import { CONSTANTS } from '../util/config';

const interactionCreate: event<'interactionCreate'> = async (
  client: Client,
  i: Interaction
) => {
  if (i.isApplicationCommand() && i.isCommand()) {
    client.logger.info(
      `Slash command ${i.commandName} called by ${
        (i.member as GuildMember).user.tag
      } (subcommand?: ${
        i.options.getSubcommand() || i.options.getSubcommandGroup() || 'none'
      })`
    );

    let entity = await client.db
      .getRepository(Guild)
      .findOne({ where: { guildId: i.guildId } });

    if (!entity) {
      entity = new Guild({
        guildId: i.guildId!,
      });

      await client.db.getRepository(Guild).save(entity);
    }

    i.guildEntity = entity;

    const command = client.slashCommands.get(i.commandName);

    await i.deferReply({ ephemeral: true });

    if (command) {
      await command.execute(i).catch((e) => {
        client.logger.error(e);
        i.editReply(CONSTANTS.ERRORS.COMMAND_RUN_ERROR);
      });
    } else {
      await i.editReply("Not implemented or doesn't exist.");
    }
  }
};

export default interactionCreate;
