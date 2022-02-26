import { SlashCommandBuilder } from '@discordjs/builders';
import { Client, CommandInteraction } from 'discord.js';
import { StringOptions } from '../types/slashcommand';

export const ticketCategories: StringOptions[] = [
  ['HTML', 'html'],
  ['Styling (CSS)', 'css'],
  ['JavaScript', 'js'],
  ['Design', 'design'],
  ['Other/unspecified', 'other'],
];

export default async function () {
  return new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create, modify, or close a support ticket.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a support ticket')
        .addStringOption((input) =>
          input
            .setName('subject')
            .setRequired(true)
            .setDescription('The subject of the ticket')
            .setAutocomplete(true)
        )
        .addStringOption((input) =>
          input
            .setName('category')
            .setRequired(true)
            .setDescription('The category of the ticket')
            .setChoices(ticketCategories)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('modify')
        .setDescription('Modify a support ticket')
        .addStringOption((option) =>
          option
            .setName('id')
            .setDescription('The ID of the ticket to modify')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('category')
            .setDescription('Modify the category of a support ticket')
            .setChoices(ticketCategories)
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('subject')
            .setDescription('Modify the subject of a support ticket')
            .setRequired(false)
        )
    )
    .addSubcommand((input) =>
      input
        .setName('close')
        .setDescription('Close a support ticket')
        .addStringOption((input) =>
          input
            .setName('id')
            .setRequired(true)
            .setDescription('The ID of the ticket to close')
            .setAutocomplete(true)
        )
    )
    .addSubcommand((input) =>
      input
        .setName('list')
        .setDescription('List tickets')
        .addBooleanOption((option) =>
          option
            .setName('closed')
            .setDescription('Show closed tickets')
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName('open')
            .setDescription('Show open tickets')
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName('mine')
            .setDescription('Show tickets assigned to me or created by me')
        )
    );
}

export async function handleTicketInteraction(
  client: Client,
  i: CommandInteraction
) {
  i.editReply('Not implemented yet.');
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
