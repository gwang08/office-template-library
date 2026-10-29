// Storage path resolution with a containment guard (defense in depth).
// All file access goes through resolveStorageKey() with keys that originate
// from the database (never from client input).
import path from 'node:path';
import { BadRequestException } from '@nestjs/common';

// src/storage -> repo root (works in dev, jest and the flat nest build dist/).
export const STORAGE_ROOT = path.resolve(__dirname, '../../../..', 'storage');

/**
 * Resolves a storage-relative key (e.g. "templates/invoice.docx") to an
 * absolute path and throws if the result escapes STORAGE_ROOT.
 * Blocks traversal-shaped keys like "../..", absolute paths and encoded dots
 * after normalization — even though keys are trusted DB values today.
 */
export function resolveStorageKey(key: string): string {
  if (typeof key !== 'string' || key.length === 0) {
    throw new BadRequestException('Invalid storage key');
  }
  const resolved = path.resolve(STORAGE_ROOT, key);
  if (resolved !== STORAGE_ROOT && !resolved.startsWith(`${STORAGE_ROOT}${path.sep}`)) {
    throw new BadRequestException(`Storage key escapes the storage root: ${key}`);
  }
  return resolved;
}
