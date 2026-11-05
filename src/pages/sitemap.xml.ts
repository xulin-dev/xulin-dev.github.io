import type { APIRoute } from 'astro';
import { series } from '../data/series';
import { getAll, hrefFor } from '../lib/entries';

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://xulin-dev.github.io');
  const all = await getAll();

  const urls = [
    '/',
    '/about/',
    '/experience/',
    '/posts/',
    '/log/',
    '/refs/',
    '/archive/',
    ...series.map((item) => `/log/series/${item.slug}/`),
    ...all.map(({ kind, entry }) => hrefFor(kind, entry.id)),
  ];

  const body = urls
    .map((path) => `  <url><loc>${new URL(path, base).toString()}</loc></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
