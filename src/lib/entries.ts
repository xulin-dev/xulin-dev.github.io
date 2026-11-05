import { getCollection } from 'astro:content';
import { KINDS } from '../consts';

export type Kind = keyof typeof KINDS;
export type AnyEntry =
  | { kind: 'posts'; entry: Awaited<ReturnType<typeof getCollection<'posts'>>>[number] }
  | { kind: 'log'; entry: Awaited<ReturnType<typeof getCollection<'log'>>>[number] }
  | { kind: 'refs'; entry: Awaited<ReturnType<typeof getCollection<'refs'>>>[number] };

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function readingTime(body = ''): number {
  const chars = body.replace(/\s+/g, '').length;
  return Math.max(1, Math.round(chars / 400));
}

export function plainText(md = ''): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getPosts() {
  const entries = await getCollection('posts', ({ data }) => !data.draft);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getLog() {
  const entries = await getCollection('log', ({ data }) => !data.draft);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getRefs() {
  const entries = await getCollection('refs', ({ data }) => !data.draft);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getAll() {
  const [posts, log, refs] = await Promise.all([getPosts(), getLog(), getRefs()]);
  const all = [
    ...posts.map((entry) => ({ kind: 'posts' as Kind, entry })),
    ...log.map((entry) => ({ kind: 'log' as Kind, entry })),
    ...refs.map((entry) => ({ kind: 'refs' as Kind, entry })),
  ];
  return all.sort((a, b) => b.entry.data.date.valueOf() - a.entry.data.date.valueOf());
}

export function hrefFor(kind: Kind, id: string): string {
  return `/${kind}/${id}/`;
}

export function allTags(entries: { data: { tags: string[] } }[]): string[] {
  return [...new Set(entries.flatMap((e) => e.data.tags))].sort((a, b) => a.localeCompare(b, 'zh'));
}
