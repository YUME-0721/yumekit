# YUMEkit

> 基于 [Fuwari](https://github.com/saicaca/fuwari) 深度定制的个人博客主题。

一个基于 Astro 构建的现代化个人博客主题，专注于技术分享与实践。

## ✨ 特性

- 🚀 基于 Astro 5.0+ 构建，性能卓越
- 📱 完全响应式设计，支持移动端
- 🌙 支持深色/浅色主题切换
- 📝 支持 Markdown 和 MDX 格式
- 🔍 内置搜索功能
- 📊 文章阅读时间统计 + Umami 访问统计
- 🏷️ 标签和分类系统
- 📈 SEO 优化
- 🎨 可自定义配置
- 💬 Giscus 评论系统
- 📡 RSS 订阅支持
- 🎯 文章目录导航（左侧边栏）

## 🛠️ 技术栈

- **框架**: Astro
- **样式**: Tailwind CSS
- **交互**: Svelte
- **构建工具**: Vite
- **包管理**: pnpm
- **代码规范**: Biome
- **统计**: Umami Cloud API
- **评论**: Giscus

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

## 📝 配置说明

### 主要配置文件

编辑 `src/config.ts` 文件来自定义博客配置：

```typescript
// 站点配置
export const siteConfig: SiteConfig = {
  title: "YUME Blog",
  subtitle: "技术分享与实践",
  lang: "zh_CN",
  // ...
}

// Umami 统计配置
export const umamiConfig: UmamiConfig = {
  enabled: true,
  apiKey: "your-api-key",
  baseUrl: "https://api.umami.is",
  websiteId: "your-website-id",
  scripts: `<script defer src="https://cloud.umami.is/script.js" data-website-id="your-website-id"></script>`,
}
```

### 文章格式

文章使用 Markdown 格式，支持 frontmatter：

```markdown
---
title: 文章标题
published: 2024-01-01
description: 文章描述
image: ./cover.jpg
tags: [标签1, 标签2]
category: 分类
draft: false
---

# 文章内容

这里是文章正文...
```

## 📁 项目结构

```
├── public/                 # 静态资源
│   ├── js/
│   │   └── umami-share.js  # Umami API 统计脚本
│   └── favicon/            # 网站图标
├── src/
│   ├── components/         # 组件
│   │   └── widget/         # 侧边栏组件（包含 TOC）
│   ├── content/            # 内容
│   │   └── posts/          # 博客文章
│   ├── layouts/            # 布局
│   ├── pages/              # 页面
│   ├── styles/             # 样式
│   ├── config.ts           # 主配置文件
│   └── types/config.ts     # 配置类型定义
└── package.json
```

## 🔧 主要定制内容

相比原版 Fuwari，本项目进行了以下定制：

1. **Umami Cloud 统计集成**
   - 全站访问量/访客数显示
   - 单篇文章访问量显示
   - 使用 API Key 认证
   - 本地缓存优化

2. **目录（TOC）移至左侧边栏**
   - 在标签下方显示
   - 滚动时悬浮固定
   - Swup 页面切换时自动更新

3. **清理与优化**
   - 移除第三方统计脚本（百度、Clarity、Google Analytics 等）
   - 简化配置结构
   - 优化加载性能

## 📦 部署

构建后的静态文件位于 `dist/` 目录，可部署到任何静态托管平台：

- Cloudflare Pages
- Vercel
- Netlify
- GitHub Pages

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

- [Fuwari](https://github.com/saicaca/fuwari) - 原始主题
- [Astro](https://astro.build) - 构建框架
- [Umami](https://umami.is) - 隐私友好的统计服务
