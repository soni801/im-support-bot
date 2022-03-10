import http from 'http';
import Client from '../util/Client';
import Logger from '../util/Logger';

import '../util/dotenv';

export default class Web {
  private _server: http.Server;
  private _client: Client;
  private _logger: Logger = new Logger(Web.name);

  config = {
    port: process.env.WEBSERVER_PORT || 8080,
  };

  constructor(discordClient: Client, serverOptions?: http.ServerOptions) {
    serverOptions
      ? (this._server = http.createServer(serverOptions))
      : (this._server = http.createServer());

    this._client = discordClient;

    this._server.on('request', async (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
      });

      const data = { ...(await this._client.getStats()), status: 'ok' };

      res.end(JSON.stringify(data));
    });

    this._server.on('listening', () => {
      this._logger.warn('Weberver listening on port ' + this.config.port);
    });

    this._server.on('error', (err) => {
      console.error(err);
    });

    this._server.on('close', () => {
      this._logger.warn('Server closed');
    });
  }

  public listen() {
    this._server.listen(this.config.port);
  }

  public close() {
    this._server.close();
  }
}
