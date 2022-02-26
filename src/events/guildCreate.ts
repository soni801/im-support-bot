import { event } from '../types/event';
import Logger from '../util/Logger';

const logger = new Logger('guildCreate');

const guildCreate: event<'guildCreate'> = (client, guild) => {
  logger.info(
    `Joined guild ${guild.name} with id ${guild.id} and permissions ${
      guild.me?.permissions.toArray().join() || 'none'
    }`
  );
};

export default guildCreate;
