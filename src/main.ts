/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Increase body size limit
  app.use(bodyParser.json({ limit: '5000mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '5000mb' }));

  // Increase request timeout
  app.use((req, res, next) => {
    req.setTimeout(60 * 60 * 1000); // 1 hour
    res.setTimeout(60 * 60 * 1000);
    next();
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('My API Documentation')
    .setDescription('API documentation for my NestJS application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Serve static files
  app.useStaticAssets(join(__dirname, '../../assets'), { prefix: '/files/' });

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://192.168.0.120:3000',
      'http://192.168.0.120:3001',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });

  // Start server
  await app.listen(3001, '0.0.0.0');
}

bootstrap();
