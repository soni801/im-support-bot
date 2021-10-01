const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, token } = require('./config.json');

const choices = [
    {
        "name": "Question 1",
        "value": "some_value_1"
    },
    {
        "name": "Question 2",
        "value": "some_value_2"
    },
    {
        "name": "Question 3",
        "value": "some_value_3"
    }
];

const commands = [
    {
        "name": "faq",
        "description": "Interact with the FAQ",
        "options": [
            {
                "type": 1,
                "name": "search",
                "description": "Search for a question in the FAQ",
                "options": [
                    {
                        "type": 3,
                        "name": "query",
                        "description": "What to search for",
                        "required": true
                    }
                ]
            },
            {
                "type": 1,
                "name": "get",
                "description": "Specify a question to get the answer to",
                "options": [
                    {
                        "type": 3,
                        "name": "choice",
                        "description": "Which question to get the answer to",
                        "required": true,
                        "choices": choices
                    }
                ]
            }
        ]
    }
];

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, "755788845085229076"), { body: commands })
    .then(() => console.log('Successfully deployed commands.'));