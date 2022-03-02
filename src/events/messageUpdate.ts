import { event } from '../types/event';
import handleBlocklisted from '../util/handleBlocklisted';
import { msgReactionHandle } from '../util/msgReactionHandle';

const messageEdit: event<'messageUpdate'> = async (client, oldMsg, newMsg) => {
  if (oldMsg.partial) {
    oldMsg = await oldMsg.fetch();
  }

  if (newMsg.partial) {
    newMsg = await newMsg.fetch();
  }

  console.log(oldMsg, newMsg);

  if (oldMsg.author.bot) return;
  if (oldMsg.content === newMsg.content) return;

  await msgReactionHandle(client, newMsg);
  await handleBlocklisted(client, newMsg, oldMsg);
};

export default messageEdit;
