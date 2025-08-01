import { readFile, writeFile } from 'fs/promises';

export async function readJSON(filePath) {
  const data = await readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

export async function writeJSON(filePath, data) {
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
