import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';

import { HttpAdapterHost } from '@nestjs/core';

/*
 * @Catch() tells NestJS that this filter can catch exceptions of any type.
 *
 * Examples:
 * - NotFoundException
 * - UnauthorizedException
 * - BadRequestException
 * - Ordinary JavaScript errors
 *
 * Without an exception type inside @Catch(), the filter is intended
 * to handle all exceptions that reach the exception-filter layer.
 *
 * @Injectable() allows NestJS to manage this class through its
 * dependency injection system.
 */
@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  /*
   * Logger is NestJS's built-in logging utility.
   *
   * HttpExceptionFilter.name gives the logger this class's name,
   * making its messages easier to identify in the terminal.
   *
   * We use this logger to record unexpected server errors.
   */
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /*
   * The constructor receives HttpAdapterHost through dependency injection.
   *
   * HttpAdapterHost provides access to the HTTP adapter used by NestJS.
   * This allows us to send responses without depending directly on
   * Express-specific methods.
   */
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /*
   * NestJS calls catch() when an exception reaches this filter.
   *
   * exception:
   *   The error that was thrown. Its type is unknown because it could
   *   be an HttpException, a JavaScript Error, or another value.
   *
   * host:
   *   Provides access to information about the current request context.
   *
   * void means this method does not return a response value directly.
   * Instead, it sends the HTTP response through the adapter.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    /*
     * Obtain the HTTP adapter.
     *
     * The adapter provides methods for reading request information
     * and sending responses.
     */
    const { httpAdapter } = this.httpAdapterHost;

    /*
     * Switch the current execution context to HTTP.
     *
     * This gives us access to the request and response objects.
     */
    const context = host.switchToHttp();

    // The incoming HTTP request, including its URL and other details.
    const request = context.getRequest();

    // The outgoing HTTP response that we will send to the client.
    const response = context.getResponse();

    /*
     * Determine the HTTP status code.
     *
     * HttpException is NestJS's base class for HTTP exceptions.
     * Examples include NotFoundException (404) and
     * UnauthorizedException (401).
     *
     * If the exception is an HttpException, use its status code.
     * Otherwise, treat it as an unexpected server error (500).
     */
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    /*
     * Set a safe default error message.
     *
     * The type allows either:
     * - A single string, such as "Project not found".
     * - An array of strings, such as validation error messages.
     *
     * Unknown server errors will keep this generic message.
     */
    let message: string | string[] = 'Internal server error';

    /*
     * Handle known NestJS HTTP exceptions.
     *
     * We only extract their detailed messages for status codes below 500.
     * This helps avoid exposing internal details from server errors.
     */
    if (exception instanceof HttpException) {
      if (statusCode < 500) {
        /*
         * getResponse() returns the response body associated with
         * the exception. It can be a string or an object.
         *
         * For example, a validation exception may contain:
         * {
         *   statusCode: 400,
         *   message: ["email must be an email"],
         *   error: "Bad Request"
         * }
         */
        const exceptionResponse = exception.getResponse();

        // Case 1: The exception response is a simple string.
        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
        }

        /*
         * Case 2: The response is a non-null object containing
         * a message property.
         *
         * The "in" operator checks whether the property exists
         * on the object or its prototype chain.
         */
        else if (
          typeof exceptionResponse === 'object' &&
          exceptionResponse !== null &&
          'message' in exceptionResponse
        ) {
          const responseMessage = exceptionResponse.message;

          /*
           * Accept only the message formats this filter supports:
           * - A string
           * - An array containing only strings
           *
           * This avoids returning arbitrary values as error messages.
           */
          if (
            typeof responseMessage === 'string' ||
            (Array.isArray(responseMessage) &&
              responseMessage.every((item) => typeof item === 'string'))
          ) {
            message = responseMessage;
          } else {
            /*
             * If the response's message has an unexpected format,
             * fall back to the HttpException's message.
             */
            message = exception.message;
          }
        } else {
          /*
           * If the response doesn't have a usable message property,
           * fall back to the exception's own message.
           */
          message = exception.message;
        }
      }

      /*
       * If the exception is an HttpException with a 5xx status,
       * the generic message remains unchanged.
       */
    }

    /*
     * Log server errors for developers to investigate.
     *
     * statusCode >= 500 includes server errors such as 500 and 503.
     *
     * If the exception is a JavaScript Error, log its stack trace.
     * Otherwise, log its string representation.
     *
     * Do not send the stack trace to the client.
     */
    if (statusCode >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    /*
     * Construct a consistent response body.
     *
     * statusCode:
     *   The HTTP status code, e.g. 404 or 500.
     *
     * timestamp:
     *   The time the error response was created, in ISO 8601 format.
     *
     * path:
     *   The requested URL, e.g. /projects/123.
     *
     * message:
     *   The safe, client-facing error message.
     */
    const responseBody = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      message,
    };

    /*
     * Send the response to the client.
     *
     * reply() takes:
     * 1. The response object.
     * 2. The response body.
     * 3. The HTTP status code.
     *
     * This completes the error response. We do not return responseBody
     * because the adapter sends it directly.
     */
    httpAdapter.reply(response, responseBody, statusCode);
  }
}
