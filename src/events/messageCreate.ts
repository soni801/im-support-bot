import type { event } from '../types/event';
import { CONSTANTS } from '../util/config';

const messageCreate: event<'messageCreate'> = async (client, msg) => {
  const prefixes = [CONSTANTS.PREFIX];

  if (msg.guild && client.user) {
    prefixes.push(`<@${client.user?.id}> `);
    prefixes.push(`<@!${client.user?.id}> `);
  }

  const parsed = client.parser.parse(msg, prefixes);

  if (!parsed.success) {
    switch (parsed.code) {
      case 1:
        client.logger.verbose(parsed.error);
        return;
      default:
        client.logger.warn(parsed.error);
        return;
    }
  }

  const cmd = client.getCommand(parsed.command);

  if (!cmd) {
    return;
  }

  await cmd.run(msg, ...parsed.arguments).catch(console.error);
};

export default messageCreate;
