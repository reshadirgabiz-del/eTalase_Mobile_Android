import serverlessExpress from '@vendia/serverless-express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

const expressApp = express();
let cachedHandler: ReturnType<typeof serverlessExpress>;

const bootstrapPromise = (async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,POST,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  cachedHandler = serverlessExpress({ app: expressApp });
})();

export const netlifyHandler = async (event: any, context: any) => {
  await bootstrapPromise;
  return cachedHandler(event, context);
};
