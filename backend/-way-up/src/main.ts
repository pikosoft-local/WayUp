import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api');
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`Server is running on port ${port}`, 'Bootstrap');
}


// Zwykłe uruchomienie lokalne
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}

// Eksport aplikacji na potrzeby Vercel (Serverless)
export default async (req: any, res: any) => {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  await app.init();
  const instance = app.getHttpAdapter().getInstance();
  instance(req, res);
};

bootstrap();