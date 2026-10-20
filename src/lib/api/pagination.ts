import { backendFetch } from './server';
export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
export async function allPages<T>(path: string): Promise<T[]> {
 const result: T[] = []; let page = 1;
 while (true) {
  const response = await backendFetch<Page<T>>(`${path}${path.includes('?') ? '&' : '?'}page=${page}&pageSize=100`);
  result.push(...response.items);
  if (result.length >= response.total || !response.items.length) return result;
  page++;
 }
}
