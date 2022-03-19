import { Message } from 'discord.js';
import * as Discord from 'discord.js';
import { inspect } from 'util';
import { Context, runInNewContext, RunningScriptOptions } from 'vm';
import chalk from 'chalk';
import axios from 'axios';
import {
  confirmation,
  parseCodeblock,
  captureOutput,
  matchString,
} from '../util/misc';
import Logger from '../util/Logger';
import Command, { CommandOptions } from '../util/Command';
import { CONSTANTS } from '../util/config';

const options = {
  callback: false,
  stdout: true,
  stderr: true,
};

export default class extends Command {
  config: CommandOptions = {
    name: 'eval',
    aliases: ['ev'],
    help: {
      shortDescription: 'Evaluates code',
      description:
        'Evaluates code, and returns the result.\nThis command is only available to the bot owner.',
      usage: '<code> | ```<code>```',
    },
    level: 3,
    permissions: { bot: ['EMBED_LINKS'] },
  };

  logger = new Logger('eval');

  // @ts-expect-error ts(7030) - Not all code paths return a value.
  async run(message: Message, ...args: string[]) {
    if (!args[0])
      return await message.reply(':x: You must provide code to execute!');

    const script: string = parseCodeblock(args.join(' '));

    const confirm = await confirmation(
      message,
      this.client
        .defaultEmbed()
        .setTitle(
          ':warning: Are you sure you would like to execute the following code:'
        )
        .setDescription('```js\n' + script + '```'),
      {
        deleteAfter: true,
      }
    );

    if (!confirm) return;

    const context: Context = {
      client: this.client,
      message,
      args,
      Discord,
      console,
      require,
      process,
      global,
    };

    const scriptOptions: RunningScriptOptions = {
      filename: `${message.author.id}@${message.guild?.id}`,
      timeout: 60000,
      displayErrors: true,
    };

    let start: number = Date.now();
    let result = execute(
      `'use strict'; (async () => { ${script} })()`,
      context,
      scriptOptions
    );
    let end: number = Date.now();

    if (
      !(await result)?.stdout &&
      !(await result)?.callbackOutput &&
      !(await result)?.stderr
    ) {
      if (
        !(await confirmation(
          message,
          ':warning: Nothing was returned. Would you like to run the code again with implicit return?',
          {
            deleteAfter: true,
          }
        ))
      )
        return;
      else {
        start = Date.now();
        result = execute(
          `'use strict'; (async () => ${script} )()`,
          context,
          scriptOptions
        );
        end = Date.now();
      }
    }

    result.then(async (res) => {
      if (
        (options.stdout && res?.stdout) ||
        (options.stderr && res?.stderr) ||
        (options.callback && res?.callbackOutput)
      ) {
        console.log(
          chalk`{red {strikethrough -}[ {bold Eval Output} ]{strikethrough ---------}}`
        );
        if (options.callback && res.callbackOutput)
          console.log(res.callbackOutput);

        if (options.stdout && res.stdout) {
          console.log(
            chalk`{red {strikethrough -}[ {bold stdout} ]{strikethrough --------------}}`
          );
          console.log(res.stdout);
        }
        if (options.stderr && res.stderr) {
          console.log(
            chalk`{red {strikethrough -}[ {bold stderr} ]{strikethrough --------------}}`
          );
          console.error(res.stderr);
        }
        console.log(
          chalk`{red {strikethrough -}[ {bold End} ]{strikethrough -----------------}}`
        );
      }

      if (
        matchString(this.client.token, inspect(res.callbackOutput).split(' '), {
          minRating: 0.6,
        }) ||
        matchString(this.client.token, inspect(res.stdout).split(' '), {
          minRating: 0.6,
        }) ||
        matchString(this.client.token, inspect(res.stderr).split(' '), {
          minRating: 0.6,
        })
      ) {
        if (
          !(await confirmation(
            message,
            ':bangbang: The bot token is likely located somewhere in the output of your code. Would you like to display the output?',
            {
              deleteAfter: true,
            }
          ))
        )
          return;
      }
      const embed: Discord.MessageEmbed = await generateEmbed(script, res, {
        start,
        end,
      });

      const msg = await message.channel.send({ embeds: [embed] });

      if (
        !(await confirmation(
          message,
          ':information_source: Would you like to post the output of this command on hastebin?',
          {
            deleteAfter: true,
          }
        ))
      )
        return;

      const evalOutput: string[] = [];

      if (res.callbackOutput) {
        evalOutput.push(
          '-[ Eval Output ]---------',
          typeof res.callbackOutput === 'string'
            ? res.callbackOutput
            : inspect(res.callbackOutput)
        );
      }

      if (res.stdout) {
        evalOutput.push(
          '-[ stdout ]--------------',
          typeof res.stdout === 'string' ? res.stdout : inspect(res.stdout)
        );
      }

      if (res.stderr) {
        evalOutput.push(
          '-[ stderr ]--------------',
          typeof res.stderr === 'string' ? res.stderr : inspect(res.stderr)
        );
      }

      const { data: body } = await axios.post(
        'https://hastebin.com/documents',
        evalOutput.join('\n')
      );

      embed.addField(
        ':notepad_spiral: Hastebin',
        `https://hastebin.com/${body.key as string}`
      );

      await msg.edit({
        embeds: [embed],
      });
    });
  }
}

async function execute(
  code: string,
  context: Context,
  options: object
): Promise<{ stdout: string; stderr: string; callbackOutput?: any }> {
  return await new Promise((resolve) => {
    try {
      captureOutput(() => runInNewContext(code, context, options))
        .then(resolve)
        .catch(resolve);
    } catch (err: any) {
      resolve(err);
    }
  });
}

async function generateEmbed(
  code: string,
  outs: any,
  { start, end }: { start: number; end: number }
): Promise<Discord.MessageEmbed> {
  const output =
    typeof outs?.callbackOutput?.then === 'function'
      ? await outs?.callbackOutput
      : outs?.callbackOutput;
  const stdout = outs?.stdout;
  const stderr = outs?.stderr;

  const embed: Discord.MessageEmbed = new Discord.MessageEmbed()
    .setFooter({ text: `Execution time: ${end - start}ms` })
    .setTimestamp();

  if (output) {
    embed
      .setTitle(':outbox_tray: Output:')
      .setDescription(
        '```js\n' +
          (
            (typeof output === 'string' ? output : inspect(output)) ||
            'undefined'
          )?.substring(0, 2000) +
          '```'
      );
  }

  if (stdout)
    embed.addField(
      ':desktop: stdout',
      '```js\n' +
        (
          (typeof stdout === 'string' ? stdout : inspect(stdout)) || 'undefined'
        )?.substring(0, 1000) +
        '```'
    );

  if (stderr)
    embed.addField(
      ':warning: stderr',
      '```js\n' +
        (
          (typeof stderr === 'string' ? stderr : inspect(stderr)) || 'undefined'
        )?.substring(0, 1000) +
        '```'
    );

  if (!embed.fields.length && !embed.description)
    embed.setTitle('Nothing was returned.');

  if (
    (stdout && !isError(outs?.callbackOutput)) ||
    (stdout && !output) ||
    (!stdout && !output && !stderr)
  )
    embed.setColor(CONSTANTS.COLORS.success);
  else if (!stdout && !output && stderr)
    embed.setColor(CONSTANTS.COLORS.warning);
  else
    embed.setColor(
      isError(output) ? CONSTANTS.COLORS.error : CONSTANTS.COLORS.success
    );

  embed.addField(
    ':inbox_tray: Input',
    '```js\n' + code.substring(0, 1000) + '```'
  );

  return embed;
}

function isError(object: object): boolean {
  const name = object?.constructor?.name;
  if (!name) return true;
  return /.*Error$/.test(name);
}
