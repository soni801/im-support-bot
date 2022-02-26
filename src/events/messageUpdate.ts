import { event } from '../types/event';

const messageEdit: event<'messageUpdate'> = async (client, oldMsg, newMsg) => {
  if (oldMsg.partial) {
    oldMsg = await oldMsg.fetch();
  }

  if (oldMsg.author.bot) return;
  if (oldMsg.content === newMsg.content) return;
};

export default messageEdit;
