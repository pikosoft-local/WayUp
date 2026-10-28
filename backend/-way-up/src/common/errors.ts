import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';

export const badRequest = (error: string) => new BadRequestException({ ok: false, error });
export const notFound = (error = 'Nie znaleziono.') => new NotFoundException({ ok: false, error });
export const tooManyRequests = (error: string) =>
  new HttpException({ ok: false, error }, HttpStatus.TOO_MANY_REQUESTS);

export const UUID_PIPE = new ParseUUIDPipe({
  exceptionFactory: () => badRequest('Nieprawidłowy identyfikator.'),
});
