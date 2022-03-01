import Guild from '../entities/Guild.entity';
import { event } from '../types/event';
import Logger from '../util/Logger';

const logger = new Logger('guildCreate');

const guildCreate: event<'guildCreate'> = async (client, guild) => {
  logger.info(
    `Joined guild ${guild.name} with id ${guild.id} and permissions ${
      guild.me?.permissions.toArray().join() || 'none'
    }`
  );

  const guildRepository = client.db.getRepository(Guild);

  const guildEntity = new Guild({
    guildId: guild.id,
  });

  await guildRepository.save(guildEntity);
};

export default guildCreate;
