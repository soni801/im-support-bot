import GuildEntity from '../entities/Guild.entity';

declare module 'discord.js' {
  interface CommandInteraction {
    guildEntity: GuildEntity;
  }
}
