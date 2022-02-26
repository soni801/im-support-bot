import { event } from '../types/event';

const ready: event<'ready'> = async (client) => {
  client.user?.setActivity({
    type: 'WATCHING',
    name: 'yall struggle to code',
    url: 'https://haha.yessness.com',
  });

  client.logger.warn(`Logged in as ${client.user?.tag}!`);
  console.log('====================');
  console.log(`Guilds: ${client.guilds.cache.size}`);
  console.log(`Users (cached): ${client.users.cache.size}`);
  console.log(`Channels: ${client.channels.cache.size}`);
  console.log('====================');
};

export default ready;
