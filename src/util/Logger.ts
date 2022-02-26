import winston from 'winston';

export default class Logger {
  name: string;

  private _logger: winston.Logger;

  transports: winston.transport[] = [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize({
          all: true,
          colors: { debug: 'blue', error: 'red' },
        }),
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.printf((info) => {
          return `[${info.timestamp}][${this.name}][${info.level}]\t${info.message}`;
        })
      ),
    }),
  ];

  constructor(name: string, options?: winston.LoggerOptions) {
    this._logger = winston.createLogger(
      options || {
        transports: this.transports,
      }
    );

    this.name = name;
  }

  debug(message: string, ...args: any[]) {
    this._logger.debug(message, ...args);
  }

  verbose(message: string, ...args: any[]) {
    this._logger.verbose(message, ...args);
  }

  info(message: string, ...args: any[]) {
    this._logger.info(message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this._logger.warn(message, ...args);
  }

  error(message: string, ...args: any[]) {
    this._logger.error(message, ...args);
  }
}
