import { event } from '../types/event';
import handlePostMessage from '../util/postMessageActions';

const messageEdit: event<'messageUpdate'> = async (client, oldMsg, newMsg) => {
  if (oldMsg.partial) {
    oldMsg = await oldMsg.fetch();
  }

  if (newMsg.partial) {
    newMsg = await newMsg.fetch();
  }

  if (oldMsg.author.bot) return;
  if (oldMsg.content === newMsg.content) return;

  handlePostMessage(client, newMsg, oldMsg);
};

export default messageEdit;
