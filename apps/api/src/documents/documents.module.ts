import { Module, type OnModuleInit } from '@nestjs/common';
import { OfficeHandlerRegistry } from '../office/office-handler.registry';
import { DocxHandler } from '../office/docx.handler';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

// The registry is provided HERE (and exported) rather than reused from
// AppModule: NestJS providers are module-scoped, so the bare
// OfficeHandlerRegistry provider declared on AppModule in Phase 02 is not
// injectable into feature modules. Phase 05 (pptx) should register its
// handler into this same instance by importing DocumentsModule.
@Module({
  controllers: [DocumentsController],
  providers: [OfficeHandlerRegistry, DocxHandler, DocumentsService],
  exports: [OfficeHandlerRegistry],
})
export class DocumentsModule implements OnModuleInit {
  constructor(
    private readonly registry: OfficeHandlerRegistry,
    private readonly docxHandler: DocxHandler,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.docxHandler);
  }
}
