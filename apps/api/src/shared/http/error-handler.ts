import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';

const BODY_PARSER_ERROR = {
  malformedJson: 'entity.parse.failed',
  payloadTooLarge: 'entity.too.large',
} as const;

function errorResponse(code: string, message: string) {
  return { error: { code, message } };
}

function isBodyParserError(error: unknown, type: string): boolean {
  return typeof error === 'object' && error !== null && (error as { type?: unknown }).type === type;
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json(errorResponse('NOT_FOUND', 'Recurso no encontrado'));
};

export function createErrorHandler(logger: Pick<Console, 'error'> = console): ErrorRequestHandler {
  return (error, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json(errorResponse(error.code, error.message));
      return;
    }

    if (isBodyParserError(error, BODY_PARSER_ERROR.malformedJson)) {
      res
        .status(400)
        .json(errorResponse('INVALID_JSON', 'El cuerpo de la petición no es JSON válido'));
      return;
    }

    if (isBodyParserError(error, BODY_PARSER_ERROR.payloadTooLarge)) {
      res
        .status(413)
        .json(errorResponse('PAYLOAD_TOO_LARGE', 'El cuerpo de la petición es muy grande'));
      return;
    }

    logger.error(error);
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Error interno del servidor'));
  };
}
