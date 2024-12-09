import { Logger, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Formatter } from './xml.formatter';

@Injectable()
export class JsonLogger extends Logger {
  public formatMessage(level: string, message: any, context?: string): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      context,
    });
  }
  public log(message: any, context?: string) {
    const formattedMessage = this.formatMessage('info', message, context);
    process.stdout.write(formattedMessage + '\n');
  }
  public error(message: any, trace?: string, context?: string) {
    const formattedMessage = this.formatMessage('error', message, context);
    process.stderr.write(formattedMessage + '\n');
    if (trace) {
      process.stderr.write(trace + '\n');
    }
  }
  public warn(message: any, context?: string) {
    const formattedMessage = this.formatMessage('warn', message, context);
    process.stdout.write(formattedMessage + '\n');
  }
  public debug(message: any, context?: string) {
    const formattedMessage = this.formatMessage('debug', message, context);
    process.stdout.write(formattedMessage + '\n');
  }

  public processException(data: any, response, result): HttpException {
    const responseData = data['s:Body'][response][result];
    const stringToSearch = 'a:';
    const replacer = new RegExp(stringToSearch, 'g');
    const json = JSON.parse(JSON.stringify(responseData).replace(replacer, ''));
    delete json.$;
    const exception = json.Exceptions;
    if (
      (Array.isArray(exception?.['b:ExceptionInformation.Exception']) &&
        exception?.['b:ExceptionInformation.Exception'].every((exceptionInformation) =>
          parseInt(exceptionInformation?.['b:ExceptionCode'])
        )) ||
      parseInt(exception?.['b:ExceptionInformation.Exception']?.['b:ExceptionCode'])
    ) {
      const exceptionFormatted = new HttpException(
        { exceptions: Formatter.forceArray(exception?.['b:ExceptionInformation.Exception']) },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      console.log(exceptionFormatted);
      return exceptionFormatted;
    }
    return new HttpException(
      { exceptions: Formatter.forceArray(exception?.['b:ExceptionInformation.Exception']) },
      HttpStatus.OK
    );
  }
}
