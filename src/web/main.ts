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

    this._server.on('request', this.handleReq.bind(this));

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

  private async handleReq(req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(200, {
      'Content-Type': 'text/plain; version=0.0.4',
    });

    const stats = await this._client.getStats();

    // Return data from client in prometheus format
    const data = `
# HELP guilds_total Number of guilds the bot is in
# TYPE guilds_total gauge
guilds_total ${stats.guilds}

# HELP users_total Number of users the bot is watching
# TYPE users_total gauge
users_total ${stats.users}

# HELP channels_total Number of channels the bot is watching
# TYPE channels_total gauge
channels_total ${stats.channels}

# HELP slash_commands_total Number of slash commands the bot is watching
# TYPE slash_commands_total gauge
slash_commands_total ${stats.slashCommands}

# HELP events_total Number of events the bot is watching
# TYPE events_total gauge
events_total ${stats.events}

# HELP commands_total Number of commands the bot is watching
# TYPE commands_total gauge
commands_total ${stats.commands}

# HELP ws_ping Websocket ping
# TYPE ws_ping gauge
ws_ping ${stats.wsPing}

# HELP uptime Uptime in milliseconds
# TYPE uptime gauge
uptime ${stats.uptime}`;

    res.end(data);
  }
}
