import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Payments-ms');
  const PORT = envs.port;

  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  app.setGlobalPrefix('api/v1');

  await app.listen(PORT);
  logger.log(`Payments Microservice is running on ${PORT}`);
}
bootstrap();
