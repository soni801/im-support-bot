const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, token } = require('./config.json');

const commands = [
    {
        name: "faq",
        description: "Retrieve an answer from the FAQ"
    }
];

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, "755788845085229076"), { body: commands })
    .then(() => console.log('Successfully deployed commands.'));