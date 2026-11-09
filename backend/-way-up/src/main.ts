import { NestFactory } from '@nestjs/core';
import { INestApplication, Logger } from '@nestjs/common';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function createApp(): Promise<INestApplication> {
  // Tworzymy i konfigurujemy instancję NestJS wspólną dla lokalnego serwera i Vercela.
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api');
  await app.init();
  return app;
}

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`Server is running on port ${port}`, 'Bootstrap');
}

if (process.env.NODE_ENV !== 'production') {
  // Lokalnie uruchamiamy zwykły serwer HTTP; Vercel używa funkcji handler poniżej.
  bootstrap();
}

let vercelApp: Promise<INestApplication> | undefined;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Jedną instancję aplikacji wykorzystujemy dla kolejnych żądań serverless.
  vercelApp ??= createApp();
  const app = await vercelApp;
  const instance = app.getHttpAdapter().getInstance();
  instance(req, res);
}