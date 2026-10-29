import path from 'node:path';
import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { OfficeModule } from './office/office.module';
import { TemplatesModule } from './templates/templates.module';
import { DocumentsModule } from './documents/documents.module';

// 100 req/min default; THROTTLE_LIMIT lets the e2e security suite verify the
// 429 path in a small burst instead of 100+ requests (documented fallback:
// any missing/invalid value keeps the production default).
const throttleLimit = Number(process.env.THROTTLE_LIMIT);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: Number.isInteger(throttleLimit) && throttleLimit > 0 ? throttleLimit : 100 },
    ]),
    // Public previews/thumbnails only. renderPath is constrained to the /assets
    // subtree so the static fallback never swallows API 404s (no SPA fallback
    // needed: the web app is a separate Vite dev server / built bundle).
    // Note: ServeStaticModule prefixes serveRoot onto string renderPaths and
    // Express 5 (path-to-regexp v8) requires named wildcards — hence '/*splat'
    // (final route: /assets/*splat). Bare '*'/RegExp renderPaths crash on Boot.
    ServeStaticModule.forRoot({
      rootPath: path.resolve(__dirname, '../../../storage/assets'),
      serveRoot: '/assets',
      renderPath: '/*splat',
    }),
    PrismaModule,
    HealthModule,
    OfficeModule,
    TemplatesModule,
    DocumentsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
