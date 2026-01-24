---
title: Markdown 扩展语法
published: 2026-01-22T23:00:00
description: 快速上手Markdown扩展语法
tags:
  - Markdown
  - 学习
  - 工具
category: Markdown
draft: false
---
大多数使用Markdown的人会发现，基础语法和扩展语法已能满足需求。但如果您长期使用Markdown，可能会发现某些必要功能确实缺失。本文提供了一些绕过Markdown限制的技巧。针对Markdown官方不支持的某些功能的替代解决方案。

💡 重要提示：这些变通方法不能保证在所有Markdown应用中生效。如需频繁使用这些技巧，建议考虑改用其他标记语言。
# 下划线：
一些应用（如 Bear 和 Simplenote）支持文本下划线，但如果你的 Markdown 处理器支持 HTML，可以使用 `<ins>` 标签：
```
一些文字 <ins>将被加下划线</ins>。
```
渲染效果：
一些文字 <ins>将被加下划线</ins>。
# 缩进：
Markdown 里的空格和制表符有特殊用途，比如创建换行或代码块。如果你想用 Tab 缩进段落，可以尝试以下方法：
```
&nbsp;&nbsp;&nbsp;&nbsp;这是一个缩进的段落。
```
渲染效果：
&nbsp;&nbsp;&nbsp;&nbsp;这是一个缩进的段落。
# 文字居中：
Markdown 没有文本对齐的语法，但可以使用 HTML 标签 `<center>`（已废弃）或 CSS 解决：
```
<p style="text-align:center">这段文字居中显示。</p>
```
渲染效果：
<p style="text-align:center">这段文字居中显示。</p>

# 文字颜色：
Markdown 不支持更改文字颜色，但 HTML 可以：
```
<font color="red">这段文字是红色的！</font>
<p style="color:blue">这段文字是蓝色的。</p>
```
渲染效果：
<font color="red">这段文字是红色的！</font>
<p style="color:blue">这段文字是蓝色的。</p>

# 注释：
Markdown 没有内置的注释功能，但可以使用一种非官方的 Hack 方法：
```
这是可见的段落。

[这是一个隐藏的注释]: # 

这是另一个可见的段落
```
渲染效果：

这是可见的段落。

[这是一个隐藏的注释]: # 

这是另一个可见的段落
# 警告:
Markdown 没有警告框功能，但可以使用引用块（>）+ Emoji + 加粗模拟：
```
> :warning: **警告：** 不要按下大红色按钮！

> :memo: **注意：** 日出很美。

> :bulb: **提示：** 记得珍惜生活中的小事
```
渲染效果：
> ⚠️ **警告：** 不要按下大红色按钮！

> 📝 **注意：** 日出很美。

> 💡 **提示：** 记得珍惜生活中的小事。

# 调整图片大小:
Markdown 不能指定图片尺寸，但可以用 HTML 设定宽高：
```
<img src="/images/rocks.jpg" width="200" height="100">
```

# 图片标题:
Markdown 没有图片标题（Caption），可以使用 HTML 的 `<figure>` 和 `<figcaption>`：
```
<figure>
    <img src="/images/rocks.jpg" alt="描述文本">
    <figcaption>这是一张描述图片。</figcaption>
</figure>
```
或者使用 Markdown 变通方法：
```
![描述文本](/images/rocks.jpg)  
*这是一张描述图片。*
```
渲染效果：
![描述文本](../../../../assets/images/VERT_112945966_p0.webp)
*这是一张描述图片*
# 新标签打开链接：
Markdown 不能指定 target="_blank"，但 HTML 可以：
```
<a href="https://markdown.com.cn" target="_blank">学习 Markdown！</a>
```
渲染效果：
<a href="https://markdown.com.cn" target="_blank">学习 Markdown！</a>

# 符号（特殊字符）:
Markdown 不能直接插入特殊符号，但可以复制粘贴，或者使用 HTML 实体：
```
版权 (©) — &copy;
注册商标 (®) — &reg;
商标 (™) — &trade;
欧元 (€) — &euro;
左箭头 (←) — &larr;
上箭头 (↑) — &uarr;
右箭头 (→) — &rarr;
下箭头 (↓) — &darr;
度数 (°) — &#176;
圆周率 (π) — &#960;
```
渲染效果：

版权 (©) — &copy;
注册商标 (®) — &reg;
商标 (™) — &trade;
欧元 (€) — &euro;
左箭头 (←) — &larr;
上箭头 (↑) — &uarr;
右箭头 (→) — &rarr;
下箭头 (↓) — &darr;
度数 (°) — &#176;
圆周率 (π) — &#960;

# 表格格式:
Markdown 不能直接在表格中换行或插入列表，但可以用 HTML 解决：
- 表格内换行:
```
| 语法      | 描述         |
| --------- | ----------- |
| 换行      | 第一段。<br><br>第二段。 |
```
- 表格内列表
```
| 语法      | 描述         |
| --------- | ----------- |
| 列表      | <ul><li>项目一</li><li>项目二</li></ul> |
```
渲染效果：

| 语法      | 描述         |
| --------- | ----------- |
| 换行      | 第一段。<br><br>第二段。 

| 语法  | 描述                                |
| --- | --------------------------------- |
| 列表  | <ul><li>项目一</li><li>项目二</li></ul> |

# 目录
某些 Markdown 解析器支持自动目录生成（如 Markdeep），但如果不支持，可以手动创建：
```
#### 目录  
- [下划线](#markdown-下划线)  
- [缩进](#markdown-缩进-tab)  
- [居中对齐](#markdown-文字居中)  
- [更改文字颜色](#markdown-文字颜色)  
```
渲染效果：
#### 目录  
- [下划线](#markdown-下划线)  
- [缩进](#markdown-缩进-tab)  
- [居中对齐](#markdown-文字居中)  
- [更改文字颜色](#markdown-文字颜色)

# 插入视频:
Markdown 不能直接嵌入视频，但可以使用 HTML，或变通方式（图片+链接）  
点击B站的分享图标，然后选择嵌入链接，会获得如下代码：
```
<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1fK4y1s7Qf&p=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" &autoplay=0> </iframe>
```
## 参数说明:
- `width="100%"`: 视频宽度设置为100%，适应文章布局
- `height="468"`: 视频高度（可根据需要调整）
- `src`: 视频嵌入链接
- `bvid=BV1fK4y1s7Qf`: B站视频BV号
- `p=1`: 视频分P（如果是多P视频）
- `autoplay=0`: 是否自动播放（0为不自动，1为自动）
- `allowfullscreen`: 允许全屏播放
- `scrolling="no"`: 禁用滚动条
- `frameborder="no"`: 无边框
## 自定义视频尺寸:

你可以根据需要调整视频的尺寸：

```html
<!-- 响应式宽度，固定高度 -->
<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1fK4y1s7Qf" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

<!-- 固定尺寸 -->
<iframe width="560" height="315" src="//player.bilibili.com/player.html?bvid=BV1fK4y1s7Qf" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

<!-- 大尺寸 -->
<iframe width="100%" height="600" src="//player.bilibili.com/player.html?bvid=BV1fK4y1s7Qf" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
```

## 高级选项:

### 自动播放:
要使视频自动播放，可以修改参数：

```html
<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1fK4y1s7Qf&autoplay=1" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
```

注意：大多数浏览器会阻止带声音的自动播放。

### 指定分P播放

对于多P视频，可以指定播放第几集：

```html
<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1fK4y1s7Qf&p=2" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
```

这会让视频直接播放第2集。

### 设置开始时间

```html
<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1fK4y1s7Qf&t=30" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
```

这会让视频从30秒处开始播放。

### 高画质模式

```html
<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1fK4y1s7Qf&high_quality=1" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
```

这会让视频默认以高画质播放（需要用户登录B站）。

## 注意事项

1. **HTTPS兼容性**：使用协议相对URL（`//player.bilibili.com`）可以同时兼容HTTP和HTTPS
2. **响应式设计**：使用百分比宽度可以适应不同屏幕尺寸
3. **移动设备**：B站视频会自动适应移动设备屏幕
4. **加载速度**：嵌入多个视频可能会影响页面加载速度
5. **地区限制**：某些视频可能有地区限制，无法在所有地区播放

## 故障排除
如果视频无法正常显示，请检查：

1. BV号是否正确
2. URL是否完整且格式正确
3. 是否有防火墙阻止访问B站
4. 浏览器是否支持HTML5视频标签
5. 视频是否已被删除或设为私密

## 其他视频平台

除了B站，你也可以使用类似方法嵌入其他平台的视频：

- **YouTube**: 使用`https://www.youtube.com/embed/VIDEO_ID`
- **腾讯视频**: 使用`https://v.qq.com/txp/iframe/player.html?vid=VIDEO_ID`
- **优酷**: 使用`https://player.youku.com/embed/VIDEO_ID`

只需获取各平台的嵌入代码，然后按照相同的方式插入到Markdown文件中即可。

