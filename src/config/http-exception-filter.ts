import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception.getStatus() === HttpStatus.NOT_FOUND ? HttpStatus.METHOD_NOT_ALLOWED : exception.getStatus();

    const exceptionResponse = exception.getResponse();

    let messageFormatted;

    try {
      if (typeof exceptionResponse === 'string') {
        messageFormatted = JSON.parse(exceptionResponse);
      } else {
        messageFormatted = exceptionResponse;
      }
    } catch {
      messageFormatted = { exceptions: [exceptionResponse] };
    }

    const responseFormatted = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...messageFormatted,
    };
    Sentry.captureMessage(JSON.stringify(responseFormatted), 'error');
    response.status(status).json(responseFormatted);
  }
}
