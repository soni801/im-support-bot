import type CustomClient from '../util/Client';

declare module 'discord.js' {
  interface GuildMember {
    client: CustomClient;
  }
}
