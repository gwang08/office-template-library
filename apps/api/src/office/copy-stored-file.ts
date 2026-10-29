// Shared byte-for-byte copy between two storage keys (template -> document).
// Extracted at the second handler (docx + pptx) because the semantics are
// part of the copy-on-use contract: mkdir the target dir, copy, never write
// to the source.
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { resolveStorageKey } from '../storage/storage.paths';

export async function copyStoredFile(sourceKey: string, targetKey: string): Promise<void> {
  const source = resolveStorageKey(sourceKey);
  const target = resolveStorageKey(targetKey);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
}
