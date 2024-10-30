import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Payments-ms');

  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: { servers: envs.natsServers }
  })

  app.startAllMicroservices();
  app.setGlobalPrefix('api/v1');

  await app.listen(envs.port);
  logger.log(`Payments Microservice is running on ${envs.port}`);
}
bootstrap();
