const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, token } = require('./config.json');
const request = require("request");

const choices = [];
request('https://help.yessness.com/assets/json/faq.json', (e, r, b) =>
{
    const faq = JSON.parse(b);
    for (const [index, value] of faq.entries())
    {
        choices.push({"name":value.question,"value":index.toString()});
    }
});

setTimeout(() =>
{
    const commands = [
        {
            name: "faq",
            description: "Interact with the FAQ",
            options: [
                {
                    type: 1,
                    name: "search",
                    description: "Search for a question in the FAQ",
                    options: [
                        {
                            type: 3,
                            name: "query",
                            description: "What to search for",
                            required: true
                        }
                    ]
                },
                {
                    type: 1,
                    name: "get",
                    description: "Specify a question to get the answer to",
                    options: [
                        {
                            type: 3,
                            name: "choice",
                            description: "Which question to get the answer to",
                            required: true,
                            choices: choices
                        }
                    ]
                }
            ]
        },
        {
            name: "ticket",
            description: "Create or modify a support ticket",
            options: [
                {
                    type: 1,
                    name: "create",
                    description: "Create a support ticket",
                    options: [
                        {
                            type: 3,
                            name: "subject",
                            description: "The subject of the ticket",
                            required: true
                        },
                        {
                            type: 3,
                            name: "category",
                            description: "The category of the ticket",
                            required: true,
                            choices: [
                                {
                                    name: "HTML",
                                    value: "html"
                                },
                                {
                                    name: "Styling (CSS)",
                                    value: "css"
                                },
                                {
                                    name: "JavaScript",
                                    value: "js"
                                },
                                {
                                    name: "Design",
                                    value: "design"
                                },
                                {
                                    name: "Other/unspecified",
                                    value: "other"
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 2,
                    name: "modify",
                    description: "Modify a support ticket",
                    options: [
                        {
                            type: 1,
                            name: "subject",
                            description: "Modify the subject of a support ticket",
                            options: [
                                {
                                    type: 4,
                                    name: "id",
                                    description: "The ID of the ticket to modify",
                                    required: true
                                },
                                {
                                    type: 3,
                                    name: "subject",
                                    description: "The new subject of the ticket",
                                    required: true
                                }
                            ]
                        },
                        {
                            type: 1,
                            name: "category",
                            description: "Modify the category of a support ticket",
                            options: [
                                {
                                    type: 4,
                                    name: "id",
                                    description: "The ID of the ticket to modify",
                                    required: true
                                },
                                {
                                    type: 3,
                                    name: "category",
                                    description: "The new category of the ticket",
                                    required: true
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 1,
                    name: "delete",
                    description: "Delete a support ticket",
                    options: [
                        {
                            type: 4,
                            name: "id",
                            description: "The ID of the ticket to remove",
                            required: true
                        }
                    ]
                }
            ]
        }
    ];

    const rest = new REST({ version: '9' }).setToken(token);
    rest.put(Routes.applicationGuildCommands(clientId, "755788845085229076"), { body: commands }).then(() => console.log('Successfully deployed commands.'));
}, 100);