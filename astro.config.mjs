import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://xulin-dev.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
