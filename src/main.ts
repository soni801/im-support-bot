import Client from './util/Client';
import { clientOptions, token } from './util/config';

let client: Client;

function start() {
  // @ts-ignore
  client = new Client(clientOptions);
  client.login(token);

  client.on('restart', async () => {
    client.logger.warn('Restarting...');
    client.destroy();
    start();
  });
}

start();

function exit(..._: any[]) {
  client.logger.warn('SIGQUIT received, exiting...');
  client.destroy();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  client.db.close().catch(() => {});
  client.timeouts.map((t) => clearInterval(t));
  console.log('Exited at ' + new Date());
}

process.on('SIGTERM', exit);
process.on('SIGQUIT', exit);
process.on('SIGINT', exit);
process.on('exit', exit);
