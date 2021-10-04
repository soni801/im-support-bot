const { Client, Intents } = require("discord.js");
const { token } = require("./config.json");
const request = require('request');

let faq;
request('https://help.yessness.com/assets/json/faq.json', (e, r, b) => faq = JSON.parse(b));

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once("ready", () =>
{
    client.user.setActivity("help messages", { type: "LISTENING" });
    console.log("Ready!");
});

client.on("interactionCreate", interaction =>
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
                                    color: 0x57fAf8,
                                    author: {
                                        name: "FAQ Search",
                                        icon_url: "https://cdn.discordapp.com/avatars/893457764871966729/0624aae7b4adf4cb6cb0cc2aeac23c48.webp"
                                    },
                                    fields: [
                                        {
                                            name: "Unavailable",
                                            value: "This feature is not yet supported in TempleBot. We suggest using `/faq get` for the time being."
                                        }
                                    ]
                                }
                            ]
                        });
                        break;
                    case "get":
                        interaction.reply({
                            embeds: [
                                {
                                    color: 0x57fAf8,
                                    author: {
                                        name: "FAQ Answer",
                                        icon_url: "https://cdn.discordapp.com/avatars/893457764871966729/0624aae7b4adf4cb6cb0cc2aeac23c48.webp"
                                    },
                                    fields: [
                                        {
                                            name: faq[interaction.options.getString("choice")].question,
                                            value: faq[interaction.options.getString("choice")].answer
                                        }
                                    ]
                                }
                            ]
                        });
                        break;
                }
                break;
        }
    }
});

client.login(token).then(() => console.log("Successfully logged in"));