const { Client, Intents, MessageActionRow, MessageSelectMenu} = require("discord.js");
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
const blocklist = ["ratio", "ratiо", "ratiο", "ratiօ"];

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// Functions for time documentation
function doubleDigit(number) { return number.toString().length < 2 ? `0${number}` : number; }
function time() { const date = new Date(); return `[${doubleDigit(date.getHours())}:${doubleDigit(date.getMinutes())}]`; }

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
    client.user.setActivity("help messages", { type: "LISTENING" });
    console.log(`${time()} Ready!`);
});

client.on("messageCreate", message =>
{
    blocklist.forEach(e =>
    {
        if (message.content.toLowerCase().includes(e.toLowerCase()))
        {
            message.delete().then(() => console.log(`${time()} Deleted message containing '${e}' from ${message.author.username}#${message.author.discriminator} in #${message.channel.name}, ${message.guild.name}`));
            message.channel.send({
                embeds: [
                    {
                        color: 0xbe1d1d,
                        author: {
                            name: "Stop my g",
                            icon_url: "https://media.discordapp.net/attachments/877474626710671371/903598778827833344/help_stop.png"
                        },
                        fields: [
                            {
                                name: `Do not ${e} me`,
                                value: `We do not approve
                                ${message.author} lookin ass`
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
    if (interaction.isCommand())
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
    }
});

client.login(token).then(() => console.log(`${time()} Successfully logged in`));