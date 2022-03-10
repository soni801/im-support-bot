import Client from './util/Client';
import { clientOptions, token } from './util/config';
import Web from './web/main';

let client: Client;
let webServer: Web;

function start() {
  // @ts-ignore
  client = new Client(clientOptions);
  webServer = new Web(client, undefined);
  client.login(token).then(() => webServer.listen());

  client.on('restart', async () => {
    client.logger.warn('Restarting...');
    client.destroy();
    webServer.close();
    start();
  });
}

start();

function exit(...arg: string[]) {
  client.logger.warn(`${arg} received, exiting...`);
  client.destroy();
  webServer.close();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  client.db.close().catch(() => {});
  client.timeouts.map((t) => clearInterval(t));
  console.log('Exited at ' + new Date());
}

process.on('SIGTERM', exit);
process.on('SIGQUIT', exit);
process.on('SIGINT', exit);
process.on('exit', exit);
