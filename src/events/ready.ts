import { event } from '../types/event';

const ready: event<'ready'> = async (client) => {
  client.logger.warn(`Logged in as ${client.user?.tag}!`);
};

export default ready;
