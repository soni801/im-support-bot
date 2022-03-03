import type { ActivityOptions, User } from 'discord.js';
import { event } from '../types/event';
import Client from '../util/Client';
import { plural } from '../util/misc';

let statusIndex = 0;

const ready: event<'ready'> = async (client: Client) => {
  setStatus(client);
  client.timeouts.push(setInterval(() => setStatus(client), 5 * 60 * 1000));

  const teamMembers: User[] | void = await client
    .fetchTeamMembers()
    .catch(console.error);

  if (teamMembers) {
    for (const admin of teamMembers) {
      client.admins.add(admin.id);
    }
    client.logger.verbose(
      `Found team members: ${teamMembers.map((m) => m.tag).join(', ')}`
    );
  }

  client.logger.info('Syncing guilds and database...');
  await client.syncDb();
  client.logger.info('Synced guilds and database.');

  console.log('====================');
  console.log(`Guilds: ${client.guilds.cache.size}`);
  console.log(`Commands: ${client.commands.size}`);
  console.log(`Admins: ${client.admins.size}`);
  console.log('====================');

  client.logger.warn(`Logged in as ${client.user?.tag}!`);
};

function setStatus(client: Client) {
  const statuses: (() => ActivityOptions)[] = [
    () => ({
      type: 'WATCHING',
      name: 'yall struggle to code',
    }),

    () => {
      const userCount = client.guilds.cache
        .toJSON()
        .reduce((prev, cur) => cur.memberCount + prev, 0);

      return {
        type: 'WATCHING',
        name: `${userCount} ${plural(userCount, 'user', 'users')}`,
      };
    },
    () => ({
      type: 'WATCHING',
      name: `${client.guilds.cache.size} ${plural(
        client.guilds.cache.size,
        'guild',
        'guilds'
      )}`,
    }),
    () => ({
      type: 'WATCHING',
      name: `${client.channels.cache.size} ${plural(
        client.channels.cache.size,
        'channel',
        'channels'
      )}`,
    }),
  ];

  client.user?.setPresence({
    activities: [statuses[statusIndex % statuses.length]()],
    status: 'online',
  });

  client.logger.verbose(
    `Changing status to ${JSON.stringify(
      statuses[statusIndex % statuses.length]()
    )}`
  );

  statusIndex = (statusIndex + 1) % statuses.length;
}

export default ready;
