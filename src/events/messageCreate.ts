/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { event } from '../types/event';
import { ErrorCodes } from '../util/CommandParser';
import { CONSTANTS } from '../util/config';
import Logger from '../util/Logger';
import { replaceHomoglyphs } from '../util/misc';
import handlePostMessage from '../util/postMessageActions';

const messageCreate: event<'messageCreate'> = async (client, msg) => {
  const logger = new Logger(messageCreate.name);

  if (msg.webhookId) return;

  if (!client.db.isConnected) {
    logger.warn('Database not connected, skipping messageCreate');
    await msg.reply(
      "I'm not connected to the database, please try again later"
    );
    return;
  }

  const acceptChannelTypes: typeof msg.channel.type[] = [
    'GUILD_PRIVATE_THREAD',
    'GUILD_PUBLIC_THREAD',
    'GUILD_TEXT',
  ];

  if (!acceptChannelTypes.includes(msg.channel.type)) {
    logger.info(
      `MessageCreate in ${msg.channel.type} channel, skipping messageCreate`
    );
    return;
  }

  const prefixes = [CONSTANTS.PREFIX];

  msg.content = replaceHomoglyphs(msg.content);

  if (msg.guild && client.user) {
    prefixes.push(`<@${client.user?.id}> `);
    prefixes.push(`<@!${client.user?.id}> `);
  }

  const parsed = client.parser.parse(msg, prefixes);

  if (!parsed.success) {
    switch (parsed.code) {
      case ErrorCodes.SPACE_BEFORE_COMMAND:
      case ErrorCodes.NO_COMMAND:
      case ErrorCodes.BOT_ACCOUNT:
        if (msg.author.id !== client.user?.id)
          client.logger.debug(parsed.error);
        break;

      case ErrorCodes.NO_PREFIX:
      case ErrorCodes.NO_BODY:
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if ((cmd.config.level ?? 0) > (await client.getLevel(msg.member!))) {
      return await msg.reply(
        ':lock: You do not have permission to use this command.'
      );
    }

    const { user, bot } = client.checkPermissions(
      cmd,
      msg.member!,
      msg.channel.type === 'GUILD_TEXT' ? msg.channel! : undefined
    );
    if (user.toArray().length || bot.toArray().length) {
      const m: string[] = [
        ':x: The command could not be preformed because one or more permissions are missing.',
      ];

      if (user.toArray().length)
        m.push(
          'You are missing:',
          ...user.toArray().map((p) => `> \`${p as string}\``),
          `**Required**: \`${user
            .toArray()
            .map((p) => `\`${p}\``)
            .join(', ')}\``
        );
      if (bot.toArray().length)
        m.push(
          'I am missing:',
          ...bot.toArray().map((p) => `> \`${p as string}\``),
          `**Required**: ${bot
            .toArray()
            .map((p) => `\`${p}\``)
            .join(', ')}`
        );

      return msg.channel.send(m.join('\n'));
    }

    if (cmd.config.disabled && !client.admins.has(msg.author.id))
      return await msg.channel.send('🔒 This command has been disabled.');

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

  handlePostMessage(client, msg);
};

export default messageCreate;
