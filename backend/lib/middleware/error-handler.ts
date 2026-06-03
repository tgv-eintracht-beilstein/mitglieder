import { AppError } from '../errors.js';
import { errorResponse } from '../response.js';
import type { ApiGatewayResponse } from '../response.js';

export type LambdaHandler = (event: any, context: any) => Promise<ApiGatewayResponse>;

export function withErrorHandler(handler: LambdaHandler): LambdaHandler {
  return async (event, context) => {
    try {
      return await handler(event, context);
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(error);
      }
      // Unexpected error — log full details, return generic response
      console.error('Unhandled error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
        }),
      };
    }
  };
}
