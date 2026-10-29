// Home of the ONE app-wide OfficeHandlerRegistry (fixes the Phase 04a
// two-instances deviation: AppModule had a bare provider nobody injected and
// DocumentsModule created its own). @Global() exports are injectable in
// every module without re-importing OfficeModule.
// Adding a new office type (e.g. xlsx) = one handler file + one provider
// line + one register line below — zero controller/service/module changes
// anywhere else. That is the extensibility story in three lines.
import { Global, Module, type OnModuleInit } from '@nestjs/common';
import { OfficeHandlerRegistry } from './office-handler.registry';
import { DocxHandler } from './docx.handler';
import { PptxHandler } from './pptx.handler';

@Global()
@Module({
  providers: [OfficeHandlerRegistry, DocxHandler, PptxHandler],
  exports: [OfficeHandlerRegistry, DocxHandler, PptxHandler],
})
export class OfficeModule implements OnModuleInit {
  constructor(
    private readonly registry: OfficeHandlerRegistry,
    private readonly docxHandler: DocxHandler,
    private readonly pptxHandler: PptxHandler,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.docxHandler);
    this.registry.register(this.pptxHandler);
  }
}
