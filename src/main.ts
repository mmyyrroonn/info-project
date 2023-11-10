import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cors from 'cors';
import { Response } from './common/response';
import { HttpFilter } from './common/filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cors());
  app.useGlobalInterceptors(new Response());
  app.useGlobalFilters(new HttpFilter());

  await app.listen(3001);
}
bootstrap();
