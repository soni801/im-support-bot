/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { nanoid } from 'nanoid';
import type { Repository } from 'typeorm';

import Guild from '../entities/Guild.entity';
import { Ticket } from '../entities/Ticket.entity';
import type { Interaction } from '../types/Interaction';
import type { StringOptions } from '../types/slashcommand';
import Client from '../util/Client';
import Logger from '../util/Logger';

export enum SubcommandNames {
  create = 'create',
  list = 'list',
  view = 'view',
  edit = 'edit',
  close = 'close',
  setup = 'setup',
}

export enum OptionNames {
  category = 'category',
  title = 'title',
  assignee = 'assignee',
  subject = 'subject',
  id = 'id',
  status = 'status',
  enabled = 'enabled',
  reason = 'reason',
}

export default class SlashTicket implements Interaction {
  public static ticketCategories: StringOptions[] = [
    ['HTML', 'html'],
    ['Styling (CSS)', 'css'],
    ['JavaScript', 'js'],
    ['Design', 'design'],
    ['Other/unspecified', 'other'],
  ];

  client: Client;
  logger = new Logger(SlashTicket.name);
  name = 'ticket';

  ticketRepository: Repository<Ticket>;
  guildRepository: Repository<Guild>;

  TicketStatus: Record<string, string> = {
    open: 'open',
    closed: 'closed',
  };

  constructor(client: Client) {
    this.client = client;

    this.ticketRepository = client.db.getRepository(Ticket);
    this.guildRepository = client.db.getRepository(Guild);
  }

  public slashCommand = async () =>
    new SlashCommandBuilder()
      .setName('ticket')
      .setDescription('Create, modify, or close a support ticket.')
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.create)
          .setDescription('Create a support ticket')
          .addStringOption((input) =>
            input
              .setName(OptionNames.subject)
              .setRequired(true)
              .setDescription('The subject of the ticket')
          )
          .addStringOption((input) =>
            input
              .setName(OptionNames.category)
              .setRequired(true)
              .setDescription('The category of the ticket')
              .setChoices(SlashTicket.ticketCategories)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SubcommandNames.edit)
          .setDescription('Modify a support ticket')
          .addStringOption((option) =>
            option
              .setName(OptionNames.id)
              .setDescription('The ID of the ticket to modify')
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName(OptionNames.category)
              .setDescription('Modify the category of a support ticket')
              .setChoices(SlashTicket.ticketCategories)
              .setRequired(false)
          )
          .addStringOption((option) =>
            option
              .setName(OptionNames.subject)
              .setDescription('Modify the subject of a support ticket')
              .setRequired(false)
          )
      )
      .addSubcommand((input) =>
        input
          .setName(SubcommandNames.close)
          .setDescription('Close a support ticket')
          .addStringOption((input) =>
            input
              .setName(OptionNames.id)
              .setRequired(true)
              .setDescription('The ID of the ticket to close')
              .setAutocomplete(true)
          )
          .addStringOption((input) =>
            input
              .setName(OptionNames.reason)
              .setDescription('The reason for closing the ticket')
              .setRequired(false)
          )
      )
      .addSubcommand((input) =>
        input
          .setName(SubcommandNames.list)
          .setDescription('List tickets')
          .addStringOption((input) =>
            input.setName(OptionNames.status).setChoices([
              ['Open', this.TicketStatus.open],
              ['Closed', this.TicketStatus.closed],
            ])
          )
          .addUserOption((option) =>
            option
              .setName(OptionNames.assignee)
              .setDescription('Filter by assignee')
          )
          .addStringOption((input) =>
            input
              .setName(OptionNames.category)
              .setDescription('Filter by category')
              .setChoices(SlashTicket.ticketCategories)
          )
      )
      .addSubcommand((input) =>
        input
          .setName(SubcommandNames.setup)
          .setDescription('Setup ticket stuff.')
          .addBooleanOption((option) =>
            option
              .setName(OptionNames.enabled)
              .setDescription('Enable or disable ticket support')
          )
      )
      .addSubcommand((input) =>
        input
          .setName(SubcommandNames.view)
          .setDescription('View a ticket')
          .addStringOption((input) =>
            input
              .setName(OptionNames.id)
              .setRequired(true)
              .setDescription('The ID of the ticket to view')
          )
      );

  public async execute(i: CommandInteraction) {
    if (!i.inGuild() || !i.guild) return;

    const subcommand = i.options.getSubcommand();

    let guild = await this.guildRepository.findOne({
      where: { guildId: i.guild.id },
    });

    if (!guild) {
      guild = await this.guildRepository.save(
        new Guild({
          guildId: i.guild.id,
        })
      );
    }

    if (!guild?.ticketSystemEnabled && subcommand !== 'setup') {
      i.editReply(
        'Ticket support is not enabled on this server. Enable it with the /ticket setup command.'
      );
      return;
    }

    switch (subcommand) {
      case SubcommandNames.create:
        await this.createTicket(i, guild);
        break;
      case SubcommandNames.edit:
        await this.editTicket(i, guild);
        break;
      case SubcommandNames.close:
        await this.closeTicket(i, guild);
        break;
      case SubcommandNames.list:
        await this.listTickets(i, guild);
        break;
      case SubcommandNames.setup:
        await this.setupTicketSystem(i, guild);
        break;
      case SubcommandNames.view:
        await this.viewTicket(i, guild);
        break;
      default:
        i.editReply(`No such subcommand: ${subcommand}`);
        break;
    }
  }

  async createTicket(i: CommandInteraction<'present'>, guild: Guild) {
    const subject = i.options.getString(OptionNames.subject)!;
    const category = i.options.getString(OptionNames.category)!;

    const shortId = nanoid(6);

    const channel = await i.guild!.channels.create<'GUILD_TEXT'>(
      `ticket-${shortId}`,
      {
        type: 'GUILD_TEXT',
        parent: guild.ticketSystemChannelId!,
      }
    );

    let ticket = new Ticket({
      subject,
      category,
      guild,
      userId: i.user.id,
      channelId: channel.id,
      shortId,
    });

    ticket = await this.ticketRepository.save(ticket);

    i.editReply(`Created ticket #${ticket.id} in ${channel}`);
  }

  async editTicket(i: CommandInteraction<'present'>, guild: Guild) {
    const id = i.options.getString(OptionNames.id)!;
    const category = i.options.getString(OptionNames.category);
    const subject = i.options.getString(OptionNames.subject);

    const ticket = await this.ticketRepository.findOne({
      where: { id, guild },
    });

    if (!ticket) {
      i.editReply(`No ticket with ID ${id}`);
      return;
    }

    if (category) {
      ticket.category = category;
    }

    if (subject) {
      ticket.subject = subject;
    }

    await this.ticketRepository.save(ticket);

    i.editReply(`Edited ticket #${ticket.id}`);
  }

  async closeTicket(i: CommandInteraction<'present'>, guild: Guild) {
    const id = i.options.getString(OptionNames.id)!;
    const reason = i.options.getString(OptionNames.reason);

    const ticket = await this.ticketRepository.findOne({
      where: { id, guild },
    });

    if (!ticket) {
      i.editReply(`No ticket with ID ${id}`);
      return;
    }

    const channel = await i.guild!.channels.fetch(ticket.channelId);

    channel?.setName(`ticket-${ticket.shortId}-closed`);

    ticket.closedAt = new Date();
    ticket.closedBy = i.user.id;
    ticket.closedReason = reason ?? 'No reason provided';

    await this.ticketRepository.save(ticket);

    i.editReply(`Closed ticket #${ticket.id}`);
  }

  async listTickets(i: CommandInteraction<'present'>, guild: Guild) {
    const status = i.options.getString(OptionNames.status);
    const assignee = i.options.getUser(OptionNames.assignee);
    const category = i.options.getString(OptionNames.category);

    const tickets = await this.ticketRepository.find({
      where: {
        guild,
        status: status ? this.TicketStatus[status] : undefined,
        assignee: assignee ? assignee.id : undefined,
        category: category ? category : undefined,
      },
    });

    const embed = this.client
      .defaultEmbed()
      .setTitle(`Tickets (${tickets.length})`);

    if (tickets.length === 0) {
      embed.setDescription('No tickets found');
    } else {
      embed.setDescription(
        tickets
          .map((ticket) => `<#${ticket.id}> - ${ticket.subject}`)
          .join('\n')
      );
    }

    i.editReply({ embeds: [embed] });
  }

  async setupTicketSystem(i: CommandInteraction<'present'>, guild: Guild) {
    const enabled = i.options.getBoolean(OptionNames.enabled);

    if (enabled) {
      const channel = await i.guild!.channels.create<'GUILD_TEXT'>(
        'ticket-system',
        {
          type: 'GUILD_TEXT',
        }
      );

      guild.ticketSystemChannelId = channel.id;
    } else if (enabled === false) {
      delete guild.ticketSystemChannelId;
      guild.ticketSystemEnabled = false;
    }

    await this.guildRepository.save(guild);

    i.editReply(`Ticket system ${enabled ? 'enabled' : 'disabled'}`);
  }

  async viewTicket(i: CommandInteraction<'present'>, guild: Guild) {
    const id = i.options.getString(OptionNames.id)!;

    const ticket = await this.ticketRepository.findOne({
      where: { id, guild },
    });

    if (!ticket) {
      i.editReply(`No ticket with ID ${id}`);
      return;
    }

    const channel = await i.guild!.channels.fetch(ticket.channelId);

    if (!channel) {
      i.editReply(`No channel with ID ${ticket.channelId}`);
      return;
    }

    const embed = this.client
      .defaultEmbed()
      .setTitle(`Ticket #${ticket.id}`)
      .setDescription(`${channel}`);

    if (ticket.closedAt) {
      embed.addField('Closed', `${ticket.closedAt}`);
      embed.addField('Closed By', `<@${ticket.closedBy}>`);
      embed.addField('Closed Reason', ticket.closedReason!);
    }

    i.editReply({ embeds: [embed] });
  }
}

/*if (interaction.isCommand())
    {
        switch (interaction.commandName)
        {
            case "ticket":
                switch (interaction.options.getSubcommand())
                {
                    case "create":
                        //  Generate ticket ID
                        const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
                        const ticketID = ++data.ticketAmount;
                        fs.writeFile("./data.json", JSON.stringify(data), e => { if (e) { console.error(e); } });

                        // Create channel
                        await interaction.guild.channels.create(`ticket-${ticketID}`).then(channel =>
                        {
                            // Set channel category
                            const category = interaction.guild.channels.cache.find(c => c.name === "tickets" && c.type === "GUILD_CATEGORY");
                            if (!category) interaction.guild.channels.create("tickets", { type: "GUILD_CATEGORY" }).then(c => channel.setParent(c));
                            else channel.setParent(category);

                            // Set channel description (topic)
                            channel.edit({ topic: `Subject: ${interaction.options.getString("subject")} | Category: ${(() =>
                            {
                                let result = "Unknown"
                                require("./deploy.js").categories.forEach((e) =>
                                {
                                    console.log(e.value, interaction.options.getString("category"));
                                    if (e.value === interaction.options.getString("category")) result = e.name;
                                });
                                return result;
                            })()}` });

                            // Reply to user
                            interaction.reply({
                                embeds: [
                                    {
                                        color: 0x4cbfc0,
                                        author: {
                                            name: "Helpdesk Ticket",
                                            icon_url: "https://media.discordapp.net/attachments/877474626710671371/903596754707030026/help_faq.png"
                                        },
                                        fields: [
                                            {
                                                name: `Ticket #${ticketID} created:`,
                                                value: interaction.options.getString("subject")
                                            },
                                            {
                                                name: "You will receive support in a private channel.",
                                                value: `Click [here](https://discord.com/channels/${interaction.guild.id}/${channel.id}) to open it`
                                            }
                                        ],
                                        timestamp: new Date(),
                                        footer: {
                                            text: "2IMITKA Helpdesk Bot"
                                        }
                                    }
                                ]
                            });
                        });
                        break;
                    case "subject":
                        // Get channel
                        const ch = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.options.getInteger("id")}`);
                        console.log(ch.topic);

                        if (!ch)
                        {
                            // Ticket doesnt exist, dont do anything
                            interaction.reply({
                                embeds: [
                                    {
                                        color: 0x4cbfc0,
                                        author: {
                                            name: "Helpdesk Ticket",
                                            icon_url: "https://media.discordapp.net/attachments/877474626710671371/903596754707030026/help_faq.png"
                                        },
                                        fields: [
                                            {
                                                name: "Can't modify ticket",
                                                value: "Ticket doesn't exist"
                                            }
                                        ],
                                        timestamp: new Date(),
                                        footer: {
                                            text: "2IMITKA Helpdesk Bot"
                                        }
                                    }
                                ]
                            });
                        }
                        else
                        {
                            // Set channel description (topic)
                            console.log(`Subject: ${interaction.options.getString("subject")} ${(() => { for (let i = ch.topic.length - 1; i >= 0; i--) if (ch.topic.charAt(i) === "|") return ch.topic.substr(i); })()}`);
                            ch.edit({ topic: `Subject: ${interaction.options.getString("subject")} ${(() => { for (let i = ch.topic.length - 1; i >= 0; i--) if (ch.topic.charAt(i) === "|") return ch.topic.substr(i); })()}` });

                            // Reply to user
                            interaction.reply({
                                embeds: [
                                    {
                                        color: 0x4cbfc0,
                                        author: {
                                            name: "Helpdesk Ticket",
                                            icon_url: "https://media.discordapp.net/attachments/877474626710671371/903596754707030026/help_faq.png"
                                        },
                                        fields: [
                                            {
                                                name: `Successfully modified ticket #${interaction.options.getInteger("id")}`,
                                                value: `Subject updated to "${interaction.options.getString("subject")}"`
                                            }
                                        ],
                                        timestamp: new Date(),
                                        footer: {
                                            text: "2IMITKA Helpdesk Bot"
                                        }
                                    }
                                ]
                            });
                        }
                        break;
                    case "category":
                        interaction.reply({
                            embeds: [
                                {
                                    color: 0x4cbfc0,
                                    author: {
                                        name: "Helpdesk Ticket",
                                        icon_url: "https://media.discordapp.net/attachments/877474626710671371/903596754707030026/help_faq.png"
                                    },
                                    fields: [
                                        {
                                            name: "Modified ticket",
                                            value: "Successfully changed the category of ticket"
                                        }
                                    ],
                                    timestamp: new Date(),
                                    footer: {
                                        text: "2IMITKA Helpdesk Bot"
                                    }
                                }
                            ]
                        });
                        break;
                    case "delete":
                        // Get channel
                        const channel = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.options.getInteger("id")}`);

                        if (!channel)
                        {
                            // Ticket doesnt exist, dont do anything
                            interaction.reply({
                                embeds: [
                                    {
                                        color: 0x4cbfc0,
                                        author: {
                                            name: "Helpdesk Ticket",
                                            icon_url: "https://media.discordapp.net/attachments/877474626710671371/903596754707030026/help_faq.png"
                                        },
                                        fields: [
                                            {
                                                name: "Can't delete ticket",
                                                value: "Ticket doesn't exist"
                                            }
                                        ],
                                        timestamp: new Date(),
                                        footer: {
                                            text: "2IMITKA Helpdesk Bot"
                                        }
                                    }
                                ]
                            });
                        }
                        else
                        {
                            // Set channel category
                            const category = interaction.guild.channels.cache.find(c => c.name === "ticket archive" && c.type === "GUILD_CATEGORY");
                            if (!category) interaction.guild.channels.create("ticket archive", { type: "GUILD_CATEGORY" }).then(c => channel.setParent(c));
                            else await channel.setParent(category);

                            // Reply to user
                            interaction.reply({
                                embeds: [
                                    {
                                        color: 0x4cbfc0,
                                        author: {
                                            name: "Helpdesk Ticket",
                                            icon_url: "https://media.discordapp.net/attachments/877474626710671371/903596754707030026/help_faq.png"
                                        },
                                        fields: [
                                            {
                                                name: "Ticket deleted",
                                                value: `Successfully deleted ticket #${interaction.options.getInteger("id")}`
                                            }
                                        ],
                                        timestamp: new Date(),
                                        footer: {
                                            text: "2IMITKA Helpdesk Bot"
                                        }
                                    }
                                ]
                            });
                        }
                        break;
                }
        }
        console.log(`${time()} Responded to command ${interaction.commandName} in #${interaction.channel.name}, ${interaction.guild.name}`);
    }
    else if (interaction.isSelectMenu())
    {
        if (interaction.customId === "selectQuestion")
        {
            await interaction.deferUpdate();
            await interaction.message.edit({
                embeds: [
                    {
                        color: 0x4cbfc0,
                        author: {
                            name: "FAQ Answer",
                            icon_url: "https://media.discordapp.net/attachments/877474626710671371/903596754707030026/help_faq.png"
                        },
                        fields: [
                            {
                                name: faq[interaction.values[0]].question,
                                value: faq[interaction.values[0]].answer
                            }
                        ],
                        timestamp: new Date(),
                        footer: {
                            text: "2IMITKA Helpdesk Bot"
                        }
                    }
                ]
            });
        }
    }*/
