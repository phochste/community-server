import type { ErrorHandler } from '../ldp/http/ErrorHandler';
import type { RequestParser } from '../ldp/http/RequestParser';
import type { ResponseDescription } from '../ldp/http/response/ResponseDescription';
import type { ResponseWriter } from '../ldp/http/ResponseWriter';
import type { OperationMetadataCollector } from '../ldp/operations/metadata/OperationMetadataCollector';
import type { RepresentationPreferences } from '../ldp/representation/RepresentationPreferences';
import { getLoggerFor } from '../logging/LogUtil';
import { assertError } from '../util/errors/ErrorUtil';
import type { HttpHandlerInput } from './HttpHandler';
import { HttpHandler } from './HttpHandler';
import type { OperationHttpHandler } from './OperationHttpHandler';

export interface ParsingHttpHandlerArgs {
  /**
   * Parses the incoming requests.
   */
  requestParser: RequestParser;
  /**
   * Generates generic operation metadata that is required for a response.
   */
  operationMetadataCollector: OperationMetadataCollector;
  /**
   * Converts errors to a serializable format.
   */
  errorHandler: ErrorHandler;
  /**
   * Writes out the response of the operation.
   */
  responseWriter: ResponseWriter;
  /**
   * Source handler to send the operation to.
   */
  source: OperationHttpHandler;
}

/**
 * Parses requests and sends the resulting Operation to wrapped source.
 * Errors are caught and handled by the Errorhandler.
 * In case the source returns a result it will be sent to the ResponseWriter.
 */
export class ParsingHttpHandler extends HttpHandler {
  private readonly logger = getLoggerFor(this);

  private readonly requestParser: RequestParser;
  private readonly errorHandler: ErrorHandler;
  private readonly responseWriter: ResponseWriter;
  private readonly operationMetadataCollector: OperationMetadataCollector;
  private readonly source: OperationHttpHandler;

  public constructor(args: ParsingHttpHandlerArgs) {
    super();
    this.requestParser = args.requestParser;
    this.errorHandler = args.errorHandler;
    this.responseWriter = args.responseWriter;
    this.operationMetadataCollector = args.operationMetadataCollector;
    this.source = args.source;
  }

  public async handle({ request, response }: HttpHandlerInput): Promise<void> {
    let result: ResponseDescription | undefined;
    let preferences: RepresentationPreferences = { type: { 'text/plain': 1 }};

    try {
      const operation = await this.requestParser.handleSafe(request);
      ({ preferences } = operation);
      result = await this.source.handleSafe({ operation, request, response });

      if (result?.metadata) {
        await this.operationMetadataCollector.handleSafe({ operation, metadata: result.metadata });
      }

      this.logger.verbose(`Parsed ${operation.method} operation on ${operation.target.path}`);
    } catch (error: unknown) {
      assertError(error);
      result = await this.errorHandler.handleSafe({ error, preferences });
    }

    if (result) {
      await this.responseWriter.handleSafe({ response, result });
    }
  }
}
