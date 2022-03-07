import type { Awaitable, ClientEvents } from 'discord.js';
import Client from '../util/Client';

export type event<K extends keyof ClientEvents> = (
  client: Client,
  ...args: ClientEvents[K]
) => Awaitable<void>;
