const { Client, Intents, MessageActionRow, MessageSelectMenu} = require("discord.js");
//const fs = require("fs");
const { token } = require("./config.json");
const request = require('request');

let faq;
request('https://help.yessness.com/assets/json/faq.json', (e, r, b) =>
{
    faq = JSON.parse(b);
    faq.forEach(e =>
    {
        e.label = e.question;
        e.value = faq.indexOf(e).toString();
    });
});

// If a message includes any of these words, delete it
// Short list of homoglyphs: https://gist.github.com/StevenACoffman/a5f6f682d94e38ed804182dc2693ed4b
const blocklist = ["ratio", "ratiо", "ratiο", "ratiօ", ":rat:", ":io:", "sus"];

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

function getQuestions(including, parse = false)
{
    const response = [];
    faq.forEach(e => { if (e.question.toLowerCase().includes(including.toLowerCase())) response.push(e); });
    if (parse)
    {
        let parsed = "";
        if (response.length > 0)
        {
            response.forEach(e => parsed += `\u2022 ${e.question}\n`);
            parsed += "**To get the answer to one of these questions, please use the selection menu under or visit [our website](https://help.yessness.com/faq/). You can also use __/faq get__.**";
        }
        else parsed = "No frequently asked questions matched your search.";
        return parsed;
    }
    return response;
}

function selectMenuWithItems(items)
{
    return items.length === 0 ? [] : [
        new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId("selectQuestion")
                    .setPlaceholder("Select an answer")
                    .addOptions(items)
            )
    ];
}

client.once("ready", () =>
{
    client.user.setActivity("ratios", { type: "LISTENING" });
    console.log(`[${new Date().toLocaleString()}] Ready!`);
});

client.on("messageCreate", message =>
{
    blocklist.forEach(e =>
    {
        if (message.content.toLowerCase().includes(e.toLowerCase()))
        {
            message.delete().then(() => console.log(`[${new Date().toLocaleString()}] Deleted message containing '${e}' from '${message.guild.members.cache.get(message.author.id).displayName}' (${message.author.username}#${message.author.discriminator}) in #${message.channel.name}, ${message.guild.name}: "${message.content}"`));
            message.channel.send({
                embeds: [
                    {
                        color: 0xbe1d1d,
                        author: {
                            name: "Stop, my g",
                            icon_url: "https://media.discordapp.net/attachments/877474626710671371/903598778827833344/help_stop.png"
                        },
                        fields: [
                            {
                                name: `Do not "${e}" me`,
                                value: `I do not approve of this
                                ${message.author} :woozy_face: :gun:`
                            }
                        ],
                        timestamp: new Date(),
                        footer: {
                            text: "2IMITKA Helpdesk Bot"
                        }
                    }
                ]
            })
        }
    });

});

client.on("interactionCreate", async interaction =>
{
    /*if (interaction.isCommand())
    {
        switch (interaction.commandName)
        {
            case "faq":
                switch (interaction.options.getSubcommand())
                {
                    case "search":
                        interaction.reply({
                            embeds: [
                                {
                                    color: 0x4cbfc0,
                                    author: {
                                        name: "FAQ Search",
                                        icon_url: "https://media.discordapp.net/attachments/877474626710671371/903596754707030026/help_faq.png"
                                    },
                                    fields: [
                                        {
                                            name: "Questions matching your search:",
                                            value: getQuestions(interaction.options.getString("query"), true)
                                        }
                                    ],
                                    timestamp: new Date(),
                                    footer: {
                                        text: "2IMITKA Helpdesk Bot"
                                    }
                                }
                            ],
                            components: selectMenuWithItems(getQuestions(interaction.options.getString("query")))
                        });
                        break;
                    case "get":
                        interaction.reply({ // This WILL break if the deploy script somehow gets an empty faq array
                            embeds: [
                                {
                                    color: 0x4cbfc0,
                                    author: {
                                        name: "FAQ Answer",
                                        icon_url: "https://media.discordapp.net/attachments/877474626710671371/903596754707030026/help_faq.png"
                                    },
                                    fields: [
                                        {
                                            name: faq[interaction.options.getString("choice")].question,
                                            value: faq[interaction.options.getString("choice")].answer
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
                }
                break;
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
});

client.login(token).then(() => console.log(`[${new Date().toLocaleString()}] Logged in`));
