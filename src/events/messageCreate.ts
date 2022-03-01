import type { event } from '../types/event';
import { ErrorCodes } from '../util/CommandParser';
import { CONSTANTS } from '../util/config';
import handleBlocklisted from '../util/handleBlocklisted';
import Logger from '../util/Logger';
import { replaceHomoglyphs } from '../util/misc';

const logger = new Logger('messageCreate');

const messageCreate: event<'messageCreate'> = async (client, msg) => {
  if (msg.webhookId) return;

  const prefixes = [CONSTANTS.PREFIX];

  msg.content = replaceHomoglyphs(msg.content);

  if (msg.guild && client.user) {
    prefixes.push(`<@${client.user?.id}> `);
    prefixes.push(`<@!${client.user?.id}> `);
  }

  const parsed = client.parser.parse(msg, prefixes);

  if (!parsed.success) {
    switch (parsed.code) {
      case ErrorCodes.NO_PREFIX:
      case ErrorCodes.NO_BODY:
      case ErrorCodes.SPACE_BEFORE_COMMAND:
      case ErrorCodes.NO_COMMAND:
      case ErrorCodes.BOT_ACCOUNT:
        if (msg.author.id !== client.user?.id)
          client.logger.debug(parsed.error);
        break;
      default:
        client.logger.warn(parsed.error);
        break;
    }
  } else {
    const cmd = client.getCommand(parsed.command);

    if (!cmd) {
      return;
    }

    logger.verbose(
      `Command ${parsed.command} was called by ${msg.author.tag} (${msg.author.id})`
    );

    return cmd.run(msg, ...parsed.arguments).catch((err) => {
      logger.error(
        `Error while running command ${parsed.command} by ${msg.author.tag} (${msg.author.id})`
      );
      console.error(err);

      msg.reply(
        `An error occured while running the command, please try again later or contact the bot owner if the problem persists.`
      );
    });
  }

  handleBlocklisted(client, msg);
};

export default messageCreate;
