import { event } from '../types/event';
import handleBlocklisted from '../util/handleBlocklisted';

const messageEdit: event<'messageUpdate'> = async (client, oldMsg, newMsg) => {
  if (oldMsg.partial) {
    oldMsg = await oldMsg.fetch();
  }

  if (newMsg.partial) {
    newMsg = await newMsg.fetch();
  }

  if (oldMsg.author.bot) return;
  if (oldMsg.content === newMsg.content) return;

  handleBlocklisted(client, newMsg, oldMsg);
};

export default messageEdit;
