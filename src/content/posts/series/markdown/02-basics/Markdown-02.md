---
title: Markdown 基础语法
published: 2026-01-16T18:00:00
description: 快速上手Markdown基础语法
tags:
  - Markdown
  - 学习
  - 工具
category: Markdown
draft: false
---
# 一. 标题：
支持两种语法，推荐使用 Atx 形式（更灵活）
- Atx 形式（推荐）

| Markdown语法               | HTML                       | 预览效果            |
| ------------------------ | -------------------------- | --------------- |
| `# Heading level 1`      | `<h1>Heading level 1</h1>` | # Heading level 1 |
| `## Heading level 2`     | `<h2>Heading level 2</h2>` | ## Heading level 2 |
| `### Heading level 3`    | `<h3>Heading level 3</h3>` | ### Heading level 3 |
| `#### Heading level 4`   | `<h4>Heading level 4</h4>` | #### Heading level 4 |
| `##### Heading level 5`  | `<h5>Heading level 5</h5>` | ##### Heading level 5 |
| `###### Heading level 6` | `<h6>Heading level 6</h6>` | ###### Heading level 6 |

- Setext 形式（可选，仅支持H1-H2）

| Markdown语法                          | HTML                       | 预览效果            |
| ----------------------------------- | -------------------------- | --------------- |
| `Heading level 1   ===============` | `<h1>Heading level 1</h1>` | Heading level 1 |
| `Heading level 2   ---------------` | `<h2>Heading level 2</h2>` | Heading level 2 |

# 二.段落与换行：
## 1. 段落：
- 由连续行组成，空行（含仅空格/tab的行）分隔不同段落，无需缩进。
- 要创建段落，请使用空白行将一行或多行文本进行分隔。
- 不要用空格（spaces）或制表符（ tabs）缩进段落。

|Markdown语法|HTML|预览效果|
|---|---|---|
|`I really like using Markdown.      I think I'll use it to format all of my documents from now on.`|`<p>I really like using Markdown.</p>      <p>I think I'll use it to format all of my documents from now on.</p>`|I really like using Markdown.<br><br>I think I'll use it to format all of my documents from now on.|
## 2. 强制换行：
行尾加 2 个以上”空格“ + ”回车“ ，或者用反斜线"\“ +”回车“（只有少数软件支持，不推荐）。

| Markdown语法                                                 | HTML                                                                | 预览效果                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------- |
| `This is the first line.     And this is the second line.` | `<p>This is the first line.<br>   And this is the second line.</p>` | This is the first line.  <br>And this is the second line. |
# 三. 强调：
- 单 `*` 或 `_`：斜体（`<em>`）
- 双 `*` 或 `_`：粗体（`<strong>`）
- 符号需成对使用，不可混合
```
*斜体文本*（推荐）
_斜体文本_
**粗体文本**（推荐）
__粗体文本__
***粗斜体文本***
```

# 四. 引用/引言：
-  行首加”>“，支持嵌套（多层”>“）和内部嵌套其他语法。
- 可仅在段落第一行加”>“，后续行自动继承
```
	> 一级引言段落1
	> 一级引言段落2
	>
	>> 嵌套二级引言
	>
	> 回到一级引言，支持嵌套列表:
	> 1. 引言内有序列表
	> 2. 列表项2
	> 
	>> ## 引言内标题
	>> '引言内代码' 
```
 
# 五.列表：
## 1.  无序列表
 支持破折号 (-)、星号 (*) 或加号 (+)。

```
	- 无序列表项1（推荐）
	- 无序列表项2
		- 嵌套子项1 （缩进1个tab或3个空格）
		- 嵌套子项2
			
	* 星号标记项（不推荐混合使用）
	+ 加号标记项（不推荐混合使用）
```
		
## 2. 有序列表
数字 + 英文句点 + 空格，数字不必按数学顺序排列，但是列表应当以数字 1 起始。

```
	1. 有序列表项1
	2. 有序列表项2
		1. 嵌套子项1（缩进）
		2. 嵌套子项2
	3. 有序列表项3
```

## 3. 列表高级用法
- 列表项含多段落：子段落需缩进 3 空格
- 列表项间空行：自动为内容添加 p标签
-  避免误触发：行首数字+句点前加反斜杠" \ "（如 1986 \ . 年份说明）

	```
		 列表项1（含多段落）
		   字段落内容（缩进 3 个空格）
		   子段落2
		   
		 列表项2（空行分割，自动加<p>标签）
	```


# 六. 代码：
## 1. 单词
- 单词或者短语，包裹在反引号 (`` ` ``) 中。

|Markdown语法|HTML|预览效果|
|---|---|---|
|``At the command prompt, type `nano`.``|`At the command prompt, type <code>nano</code>.`|At the command prompt, type `nano`.|
-  转义反引号

| Markdown语法                                    | HTML                                               | 预览效果                                  |
| --------------------------------------------- | -------------------------------------------------- | ------------------------------------- |
| ``` ``Use `code` in your Markdown file.`` ``` | ``<code>Use `code` in your Markdown file.</code>`` | ``Use `code` in your Markdown file.`` |

## 2. 代码块
### 2.1 缩进式
- 行首缩进 1 个tab或者 4 个空格，适用于短代码块
```
	普通段落：
		const a = 1; // 缩进 1 个tab的代码块
		console.log(a);
```
### 2.2 进阶用法（围栏式）
- 用三个反引号（(` ``` `）或三个波浪号（~~~）
````
```
{
  "firstName": "John",
  "lastName": "Smith",
  "age": 25
}
```
````
### 2.3 语法高亮
请在受防护的代码块之前的反引号旁边指定一种语言。

```
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "age": 25
}
```
# 七. 分割线：
 - 一行上使用三个或多个星号 (`***`)、破折号 (`---`) 或下划线 (`___`) ，并且不能包含其他内容。
 - 为了兼容性，最好在分隔线的前后均添加空白行。
 ```
内容1
  
---
 
内容2
 
***
 
内容3
 
___
 ```
# 八. 链接
## 1. 行内链接（推荐，直观）
- 链接文本放在中括号内，链接地址放在后面的括号中，链接title可选。
```
[链接文本](http://example.com "可选标题，hover显示")
```
	
## 2. 网站和Email地址
- 使用尖括号可以很方便地把URL或者email地址变成可点击的链接。
	```
	<https://markdown.com.cn>
	<fake@example.com>
	```
## 3. 带格式化的链接
- [强调](https://markdown.com.cn/basic-syntax/links.html#emphasis) 链接, 在链接语法前后增加星号。 要将链接表示为代码，请在方括号中添加反引号。
```
I love supporting the **[EFF](https://eff.org)**.
This is the *[Markdown Guide](https://www.markdownguide.org)*.
See the section on [`code`](#code).
```
	
## 4. 参考式链接（适合多次引用同一链接）
- 第一部分格式:
	- 使用两组括号进行格式设置，第一组方括号为显示链接的文本；第二组括号显示了一个用于指向您存储在文档其他位置的链接。
	- 可以在第一组和第二组括号之间包含一个空格。第二组括号中的标签不区分大小写，可以包含字母，数字，空格或标点符号。
```
[hobbit-hole][1]
[hobbit-hole] [1]
```
- 第二部分格式（习惯放到文档末尾）:
	- 放在括号中的标签，其后紧跟一个冒号和至少一个空格（例如`[label]:`）。
	- 链接的URL，可以选择将其括在尖括号中。
	- 链接的可选标题，可以将其括在双引号，单引号或括号中。
```
[1]: https://en.wikipedia.org/wiki/Hobbit#Lifestyle
[1]: https://en.wikipedia.org/wiki/Hobbit#Lifestyle "Hobbit lifestyles"
[1]: https://en.wikipedia.org/wiki/Hobbit#Lifestyle 'Hobbit lifestyles'
[1]: https://en.wikipedia.org/wiki/Hobbit#Lifestyle (Hobbit lifestyles)
[1]: <https://en.wikipedia.org/wiki/Hobbit#Lifestyle> "Hobbit lifestyles"
[1]: <https://en.wikipedia.org/wiki/Hobbit#Lifestyle> 'Hobbit lifestyles'
[1]: <https://en.wikipedia.org/wiki/Hobbit#Lifestyle> (Hobbit lifestyles)
```
# 九. 图片
## 1. 行内图片
```
// 使用感叹号 (`!`), 然后在方括号增加替代文本，图片链接放在圆括号里，括号里的链接后可以增加一个可选的图片标题文本。
插入图片Markdown语法代码：
![图片alt](图片链接 "图片title")

对应的HTML代码：
<img src="图片链接" alt="图片alt" title="图片title">
```
## 2. 参考式图片
```
// 给图片增加链接，将图像的Markdown 括在方括号中，然后将链接添加在圆括号中。
[![沙漠中的岩石图片](/assets/img/shiprock.jpg "Shiprock")](https://markdown.com.cn)

![替代文本][imgId]
[imgId]: /path/to/img.webp "可选标题"
```
# 十. 转义字符
## 1. 可做转义的字符
- 以下列出的字符都可以通过使用反斜杠字符从而达到转义目的。
```
\   反斜线
`   反引号
*   星号
_   底线
{}  大括号
[]  方括号
()  括号
#   井字号
+   加号
-   减号
.   英文句点
!   惊叹号
|   竖线
```
## 2. 特殊字符自动转义
在 HTML 文件中， `<` 和 `&` 不会转换，在其它情况下，它则会被转换成 `&lt;` 和 `&amp;`。

# 十一. 内嵌 HTML 标签
如需使用 HTML，不需要额外标注这是 HTML 或是 Markdown，只需 HTML 标签添加到 Markdown 文本中即可。
## 1. 行级內联标签
HTML 的行级內联标签如 `<span>`、`<cite>`、`<del>` 不受限制，可以在 Markdown 的段落、列表或是标题里任意使用。依照个人习惯，甚至可以不用 Markdown 格式，而采用 HTML 标签来格式化。
```
This **word** is bold. This <em>word</em> is italic.
```
渲染效果：This **word** is bold. This _word_ is italic.
## 2. 区块标签
区块元素──比如 `<div>`、`<table>`、`<pre>`、`<p>` 等标签，必须在前后加上空行，以便于内容区分。而且这些元素的开始与结尾标签，不可以用 tab 或是空白来缩进。Markdown 会自动识别这区块元素，避免在区块标签前后加上没有必要的 `<p>` 标签。
```
This is a regular paragraph.

<table>
    <tr>
        <td>Foo</td>
    </tr>
</table>

This is another regular paragraph.

//Markdown 语法在 HTML 区块标签中将不会被进行处理
```