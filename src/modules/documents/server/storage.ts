import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.join(process.cwd(), 'uploads');
const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

export async function saveLocalDocument(file: File) {
  const id = crypto.randomUUID(); const storageKey = `${id}-${safeName(file.name)}`;
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, storageKey), Buffer.from(await file.arrayBuffer()));
  return { storageKey, storedName: storageKey };
}

export async function readLocalDocument(storageKey: string) {
  if (storageKey.includes('..') || path.basename(storageKey) !== storageKey) throw new Error('Invalid storage key');
  return readFile(path.join(root, storageKey));
}

export async function deleteLocalDocument(storageKey: string) {
  if (storageKey.includes('..') || path.basename(storageKey) !== storageKey) throw new Error('Invalid storage key');
  await unlink(path.join(root, storageKey)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
}
