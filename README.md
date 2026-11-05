# 徐淋的个人站点

徐淋的个人站点：Linux 应用开发 / ZYNQ 嵌入式。Astro 静态站点，手写 CSS，部署在 GitHub Pages。

参考了 [hecongs.github.io](https://hecongs.github.io/) 的信息结构：主页 + 学习专栏 + 文章 + 素材 + 关于 + 经历，折叠目录、双主题、站内搜索。

## 本地运行

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # 输出到 dist/
npm run preview   # 预览构建结果
```

Node 18+，推荐 22。

## 目录

```text
src/
├── consts.ts              # 站点名称、角色、邮箱、GitHub、导航
├── content.config.ts      # 三个内容集合的 frontmatter 校验
├── content/
│   ├── posts/             # 文章
│   ├── log/               # 学习专栏（带 series / order）
│   └── refs/              # 素材
├── data/
│   ├── experience.ts      # 工作经历、教育、技术栈
│   └── series.ts          # 专栏系列
├── layouts/
│   ├── BaseLayout.astro   # 页面骨架、主题切换、页脚
│   └── EntryLayout.astro  # 文章页：目录、上下篇、标签
├── components/            # 顶栏、页脚、徽章、时间线
├── pages/
│   ├── index.astro        # 主页
│   ├── about.astro
│   ├── experience.astro
│   ├── archive.astro      # 全部记录（混合时间线）
│   ├── posts/             # 列表 + [slug]
│   ├── log/               # 列表 + [slug] + series/[slug]
│   ├── refs/              # 列表 + [slug]
│   ├── search.astro       # 站内搜索（读取 search-index.json）
│   ├── search-index.json.ts
│   ├── rss.xml.ts
│   └── sitemap.xml.ts
└── styles/global.css      # 设计令牌与全部样式
```

## 写一篇内容

在 `src/content/posts/` 新建 markdown：

```md
---
title: 标题
description: 一句话摘要，会出现在列表和搜索里
date: 2026-11-05
tags: [ZYNQ, Linux]
draft: false
---

正文……
```

学习专栏多两个字段：

```md
---
title: 01 拿到一块 ZYNQ 板子，先跑通什么
description: ……
date: 2026-11-03
series: zynq-bringup   # 对应 src/data/series.ts 里的 slug
order: 1               # 系列内的顺序
tags: [ZYNQ]
---
```

文件名会直接变成 URL，建议保持 `日期-英文短名.md`：

```text
src/content/posts/2026-11-05-uart-dma.md
→ /posts/2026-11-05-uart-dma/
```

`draft: true` 的内容不会出现在列表、RSS 和搜索里。

## 要替换的占位内容

站点目前是**可直接运行的示例**，文字按 Linux / ZYNQ 方向编写，但公司和学校是占位。上线前至少改这些：

1. `src/consts.ts`：`name`、`nameEn`、`role`、`tagline`、`description`、`email`、`github`、`since`。
2. `src/data/experience.ts`：公司名、时间段、项目细节、教育背景、技术栈。
3. `src/data/series.ts`：专栏标题和描述。
4. `src/content/`：把示例文章替换成自己的，或先删到只剩几篇。
5. `public/robots.txt`、`src/pages/sitemap.xml.ts`、`astro.config.mjs`：如果不是 `xulin-dev.github.io`，把域名一起换掉。
6. `src/pages/about.astro`：自我介绍和联系方式。

## 改样式

所有颜色、宽度、圆角都在 `src/styles/global.css` 顶部：

```css
:root {
  --bg: #f7f5f0;
  --accent: #2c6a5d;
  --w-page: 1040px;
  ...
}
```

深色模式是同一组变量的另一份值，加 `data-theme="dark"` 时生效，未手动切换时跟随系统。主题按钮的逻辑在 `BaseLayout.astro` 底部。

## 分享图

`public/og.png` 是链接在微信、X 等平台展开时的预览图，尺寸 1200×630。改完名字或角色后重新生成：

```bash
npm run og
```

脚本在 `scripts/og.mjs`，用系统中文字体渲染「徐淋」；如果构建机上没有 CJK 字体，这一处会缺字，装 `fonts-noto-cjk` 即可。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库，名字必须是 `<用户名>.github.io`（这里是 `xulin-dev.github.io`）。
2. 推送代码到 `main` 分支。
3. 仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。
4. 推上去后 `.github/workflows/deploy.yml` 会自动构建并发布，几分钟后访问 `https://xulin-dev.github.io/`。

首次部署如果 404，先看 Actions 里 `deploy` 这一步的日志，再确认 Pages 的 Source 是否是 GitHub Actions。

## 说明

- 没有统计、评论和第三方字体，构建产物约 500 KB。
- 搜索索引在构建时生成，纯前端过滤，不依赖服务端。
- 内容许可按自己的需要改；页脚默认写的是「个人记录，转载请注明出处」。
