// Registry of per-kind office handlers. Empty in Phase 02 by design —
// the docx handler lands in Phase 04 and the pptx handler in Phase 05.
// This is the documented extensibility seam: a new office type = implement
// OfficeHandler + register(kind, handler); no controller/service changes.
import { Injectable, NotImplementedException } from '@nestjs/common';
import type { OfficeHandler, OfficeKind } from './office-handler.interface';

@Injectable()
export class OfficeHandlerRegistry {
  private readonly handlers = new Map<OfficeKind, OfficeHandler>();

  register(handler: OfficeHandler): void {
    if (this.handlers.has(handler.kind)) {
      throw new Error(`Office handler already registered for kind "${handler.kind}"`);
    }
    this.handlers.set(handler.kind, handler);
  }

  getHandler(kind: OfficeKind): OfficeHandler {
    const handler = this.handlers.get(kind);
    if (!handler) {
      throw new NotImplementedException(`No office handler registered for kind "${kind}"`);
    }
    return handler;
  }

  hasHandler(kind: OfficeKind): boolean {
    return this.handlers.has(kind);
  }

  get supportedKinds(): OfficeKind[] {
    return [...this.handlers.keys()];
  }
}
