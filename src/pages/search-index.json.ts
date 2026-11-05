import type { APIRoute } from 'astro';
import { getAll, hrefFor, plainText, formatDate } from '../lib/entries';

export const GET: APIRoute = async () => {
  const all = await getAll();
  const payload = all.map(({ kind, entry }) => ({
    title: entry.data.title,
    description: entry.data.description,
    url: hrefFor(kind, entry.id),
    kind,
    date: formatDate(entry.data.date),
    tags: entry.data.tags,
    text: plainText(entry.body ?? '').slice(0, 4000),
  }));

  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
