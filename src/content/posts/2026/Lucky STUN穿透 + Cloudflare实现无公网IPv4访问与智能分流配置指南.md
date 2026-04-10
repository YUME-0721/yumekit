---
title: Lucky STUN穿透 + Cloudflare实现无公网IPv4访问与智能分流配置指南
published: 2026-04-01T17:00:00
description: 本文介绍如何使用Lucky的STUN穿透功能结合Cloudflare Workers，在仅有公网IPv6、无公网IPv4的家庭网络环境下，实现外网IPv4环境访问、IPv6环境自动分流，并统一使用不带端口的泛域名访问
tags:
  - 网络配置
  - STUN穿透
  - 反向代理
  - Cloudflare
category: 技术教程
pinned: false
---

## 概述

本文介绍如何使用Lucky的STUN穿透功能结合Cloudflare Workers，在仅有公网IPv6、无公网IPv4的家庭网络环境下，实现外网IPv4环境访问、IPv6环境自动分流，并统一使用不带端口的泛域名访问。

## 前置准备

### 1. 网络环境要求
- 家庭宽带有公网IPv6地址
- 路由器拨号（推荐，减少NAT层级）
- NAT类型：NAT1最佳，NAT3通常可用（可通过Lucky STUN页面测试）

### 2. 软件和域名要求
- 已安装Lucky（推荐2.23.3或更新版本）
- 拥有一个域名（推荐付费域名）
- 域名托管至Cloudflare

## Cloudflare配置

### 1. 获取账户ID
1. 登录Cloudflare账户
2. 进入托管的域名页面
3. 右侧下滑至底部，复制「账户ID」

### 2. 添加DNS泛域名解析
```
类型：CNAME
名称：*（通配符）
目标：cf.090227.xyz（优选地址）
代理状态：不勾选
```

### 3. 创建API令牌
1. 进入「API」→「获取您的API令牌」
2. 创建自定义令牌
3. 权限设置：账户 → workers脚本 → 编辑
4. 资源设置：包括所有账户

## Lucky配置

### 1. DDNS动态解析配置
**创建专用DDNS令牌：**
- 权限：区域 → DNS → 编辑
- 资源：包含你的域名

**Lucky DDNS设置：**
- 托管服务商：Cloudflare
- 启用{ipv4Addr}和{ipv6Addr}
- 添加同步记录：
  - `*.ipv4.你的域名.xyz` → A记录 → {ipv4Addr}
  - `*.ipv6.你的域名.xyz` → AAAA记录 → {ipv6Addr}

### 2. 反向代理设置
在每个服务的反向代理配置中，添加三个前端地址：
- `子域名.你的域名.xyz`
- `子域名.ipv4.你的域名.xyz`
- `子域名.ipv6.你的域名.xyz`

### 3. STUN内网穿透配置（核心）

**穿透规则设置：**
- 穿透类型：TCP
- 本地端口：0（随机分配）
- 关闭防火墙自动放行
- 目标地址：Lucky所在设备IP
- 目标端口：Lucky反向代理监听端口

**WebHook配置：**
```
接口地址：https://api.cloudflare.com/client/v4/accounts/你的账户ID/workers/scripts/redirect
请求方法：PUT
请求头：
  Authorization: Bearer 你的API令牌
  Content-Type: application/javascript
```

## Cloudflare Workers智能重定向脚本

```javascript
const CONFIG = {
  domain: '你的域名.xyz',
  v4: {
    target: 'ipv4.你的域名.xyz',
    port: Number(#{port}) || 80
  },
  v6: {
    target: 'ipv6.你的域名.xyz',
    port: 16667
  }
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // 智能重定向逻辑...
  // 根据客户端IP版本自动分流
  // 浏览器使用JS跳转，应用使用307重定向
}
```

## 路由绑定

在Cloudflare Workers中绑定路由：
- 路由模式：`*.你的域名.xyz/*`
- 确保规则生效

## 测试与验证

### 功能测试
- **IPv4环境**：访问`emby.你的域名.xyz` → 自动跳转至`emby.ipv4.你的域名.xyz:端口`
- **IPv6环境**：访问`emby.你的域名.xyz` → 自动跳转至`emby.ipv6.你的域名.xyz:16667`

### 常见问题排查
1. **端口获取失败**：检查API令牌权限
2. **重定向不生效**：验证Workers路由绑定
3. **访问失败**：检查防火墙和反代设置

## 优化建议

### HTTPS加密
在Lucky中为`*.ipv4.你的域名.xyz`和`*.ipv6.你的域名.xyz`配置自动SSL证书申请。

### 应用兼容性
- 适用于浏览器Web服务
- 应用内登录需看具体支持情况
- 优化密码存储和会话保持

## 优势总结

1. **智能分流**：根据客户端IP版本自动选择最佳路径
2. **端口隐藏**：用户体验更友好
3. **高可用性**：IPv4/IPv6双栈保障
4. **安全性**：Cloudflare提供DDoS防护

## 注意事项

- 确保所有配置步骤正确无误
- 定期检查API令牌有效期
- 监控服务运行状态
- 备份重要配置

## 结语

通过Lucky STUN穿透与Cloudflare的完美结合，成功解决了仅有IPv6公网地址的访问难题，为用户提供了稳定、安全、便捷的远程访问体验。这种配置方案特别适合家庭NAS、媒体服务器等应用场景。

---
*本文基于网络技术分享整理，仅作技术交流使用。*