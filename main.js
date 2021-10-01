const { Client, Intents } = require("discord.js");
const { token } = require("./config.json");

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
                interaction.reply("ok but i am a bad bot");
                break;
        }
    }
});

client.login(token).then(() => console.log("Successfully logged in"));