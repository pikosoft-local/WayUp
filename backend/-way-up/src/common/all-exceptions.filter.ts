import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';

interface OkFalseBody {
  ok: false;
  error: string;
}

const isOkFalse = (body: unknown): body is OkFalseBody =>
  typeof body === 'object' && body !== null && (body as OkFalseBody).ok === false;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (isOkFalse(body)) {
        response.status(status).json(body);
        return;
      }

      const raw =
        typeof body === 'string' ? body : (body as { message?: string | string[] }).message;
      const message = Array.isArray(raw) ? raw.join('; ') : (raw ?? exception.message);
      response.status(status).json({
        ok: false,
        error: status === 404 ? 'Nie znaleziono.' : message,
      });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.message : String(exception),
      exception instanceof Error ? exception.stack : undefined,
    );
    response.status(500).json({ ok: false, error: 'Wewnętrzny błąd serwera.' });
  }
}
