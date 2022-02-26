import { SlashCommandBuilder } from '@discordjs/builders';
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
