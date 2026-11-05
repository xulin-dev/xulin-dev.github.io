import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const base = z.object({
  title: z.string(),
  description: z.string().default(''),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: base,
});

const log = defineCollection({
  loader: glob({ base: './src/content/log', pattern: '**/*.md' }),
  schema: base.extend({
    series: z.string(),
    order: z.number().default(0),
  }),
});

const refs = defineCollection({
  loader: glob({ base: './src/content/refs', pattern: '**/*.md' }),
  schema: base,
});

export const collections = { posts, log, refs };
