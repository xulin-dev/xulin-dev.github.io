export const SITE = {
  name: '徐淋',
  nameEn: 'Xulin',
  handle: 'xulin',
  role: 'Linux 应用开发工程师',
  tagline: 'Linux 应用 · ZYNQ 嵌入式 · 板端调试',
  description:
    '徐淋的个人站点：Linux 应用开发、ZYNQ 嵌入式与板端调试的笔记、文章和素材。',
  email: '',
  github: 'https://github.com/xulin-dev',
  since: 2021,
  locale: 'zh-CN',
};

export const NAV = [
  { href: '/about/', label: '关于', key: 'about' },
  { href: '/experience/', label: '经历', key: 'experience' },
  { href: '/log/', label: '学习专栏', key: 'log' },
  { href: '/posts/', label: '文章', key: 'posts' },
  { href: '/refs/', label: '素材', key: 'refs' },
];

export const KINDS = {
  posts: { label: '文章', className: 'kind-post', href: '/posts/' },
  log: { label: '学习专栏', className: 'kind-log', href: '/log/' },
  refs: { label: '素材', className: 'kind-ref', href: '/refs/' },
} as const;
