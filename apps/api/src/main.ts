import helmet from 'helmet';
import { json } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Aligned with the UpdateDocumentDto contentHtml cap (2,000,000 chars).
// Express's default 100kb json limit made that DTO guard unreachable dead
// code — every >100kb PATCH 413'd before validation could run (found by the
// phase-06 e2e oversize test). Worst-case multibyte payloads beyond this
// limit are still rejected, by the 413 layer.
const JSON_BODY_LIMIT = '2.5mb';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(json({ limit: JSON_BODY_LIMIT }));
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

void bootstrap();
