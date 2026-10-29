import { NotImplementedException } from '@nestjs/common';
import { OfficeHandlerRegistry } from './office-handler.registry';
import type { OfficeHandler } from './office-handler.interface';

const fakeHandler = (kind: OfficeHandler['kind']): OfficeHandler => ({
  kind,
  createDocumentCopy: async () => undefined,
  exportDocument: async () => undefined,
});

describe('OfficeHandlerRegistry', () => {
  it('throws 501 NotImplementedException for an unregistered kind', () => {
    const registry = new OfficeHandlerRegistry();
    expect(() => registry.getHandler('docx')).toThrow(NotImplementedException);
    expect(() => registry.getHandler('docx')).toThrow(/No office handler registered/);
  });

  it('registers and resolves a handler', () => {
    const registry = new OfficeHandlerRegistry();
    const handler = fakeHandler('pptx');
    registry.register(handler);
    expect(registry.getHandler('pptx')).toBe(handler);
    expect(registry.supportedKinds).toEqual(['pptx']);
  });

  it('rejects duplicate registration for the same kind', () => {
    const registry = new OfficeHandlerRegistry();
    registry.register(fakeHandler('docx'));
    expect(() => registry.register(fakeHandler('docx'))).toThrow(/already registered/);
  });
});
