import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

// Pure feature wiring: the registry and all office handlers live in the
// @Global() OfficeModule (single app-wide instance), so DocumentsService
// injects the same registry the handlers are registered into. Registering a
// new office kind requires NO change to this module.
@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
