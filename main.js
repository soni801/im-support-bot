const { Client, Intents } = require("discord.js");
const { token } = require("./config.json");
const request = require('request');

let faq;
request('https://help.yessness.com/assets/json/faq.json', (e, r, b) => faq = b);

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
                interaction.reply(faq.substr(0, 2000));
                break;
        }
    }
});

client.login(token).then(() => console.log("Successfully logged in"));