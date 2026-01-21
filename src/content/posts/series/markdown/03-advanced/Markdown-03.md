---
title: Markdown 进阶语法
published: 2026-01-21T18:00:00
description: 快速上手Markdown进阶语法
tags:
  - Markdown
  - 学习
  - 工具
category: Markdown
draft: false
---
基本语法主要是为了应付大多数情况下的日常所需元素，但对于某些人来说还不够，这就是扩展语法的用武之地。

一些个人和组织开始通过添加其他元素（例如表，代码块，语法突出显示，URL自动链接和脚注）来扩展基本语法。可以通过使用基于基本Markdown语法的轻量级标记语言，或通过向兼容的Markdown处理器添加扩展来启用这些元素。

# 一. 表格
## 1. 表
要添加表，使用三个或多个连字符（`---`）创建每列的标题，并使用管道（`|`）分隔每列。您可以选择在表的任一端添加管道。
```
| Syntax | Description |
| --- | ----------- |
| Header | Title |
| Paragraph | Text |
```
- 单元格宽度可以变化，如上示例呈现的输出将看起来相同。
- 使用连字符和管道创建表可能很麻烦。为了加快该过程，可以尝试使用图形界面构建表（例如[Markdown Tables Generator](https://www.tablesgenerator.com/markdown_tables)），然后将生成的Markdown格式的文本复制到文件中。
## 2. 对齐
可以通过在标题行中的连字符的左侧，右侧或两侧添加冒号（`:`），将列中的文本对齐到左侧，右侧或中心。
```
| Syntax      | Description | Test Text     |
| :---        |    :----:   |          ---: |
| Header      | Title       | Here's this   |
| Paragraph   | Text        | And more      |
```
输出如下所示:

| Syntax    | Description |   Test Text |
| :-------- | :---------: | ----------: |
| Header    |    Title    | Here's this |
| Paragraph |    Text     |    And more |
## 3. 格式化表格中的文字
- 可以在表格中设置文本格式。例如，您可以添加链接，代码（仅反引号（`` ` ``）中的单词或短语，而不是代码块）和强调。
- 您不能添加标题，块引用，列表，水平规则，图像或HTML标签。
## 4. 在表中转义管道字符
可以使用表格的HTML字符代码（&#124;）在表中显示竖线（|）字符。

# 二. 脚注
脚注使您可以添加注释和参考，而不会使文档正文混乱。当您创建脚注时，带有脚注的上标数字会出现在您添加脚注参考的位置。读者可以单击链接以跳至页面底部的脚注内容。

要创建脚注参考，请在方括号（`[^1]`）内添加插入符号和标识符。标识符可以是数字或单词，但不能包含空格或制表符。标识符仅将脚注参考与脚注本身相关联-在输出中，脚注按顺序编号。

在括号内使用另一个插入符号和数字添加脚注，并用冒号和文本（`[^1]: My footnote.`）。您不必在文档末尾添加脚注。您可以将它们放在除列表，块引号和表之类的其他元素之外的任何位置。
```
Here's a simple footnote,[^1] and here's a longer one.[^bignote]

[^1]: This is the first footnote.

[^bignote]: Here's one with multiple paragraphs and code.

    Indent paragraphs to include them in the footnote.

    `{ my code }`

    Add as many paragraphs as you like.
```
呈现的输出如下所示：

Here's a simple footnote,[^1] and here's a longer one.[^bignote]

[^1]: This is the first footnote.

[^bignote]: Here's one with multiple paragraphs and code.

    Indent paragraphs to include them in the footnote.

    `{ my code }`

    Add as many paragraphs as you like.
    
# 三. 标题编号
许多Markdown处理器支持标题的自定义ID 
- 一些Markdown处理器会自动添加它们。
- 添加自定义ID允许您直接链接到标题并使用CSS对其进行修改。
- 要添加自定义标题ID，请在与标题相同的行上用大括号括起该自定义ID。
```
### My Great Heading {#custom-id}
```
对应的HTML是这样：

```html
<h3 id="custom-id">My Great Heading</h3>
```

## 链接到标题ID（#headid）
通过创建带有数字符号（`#`）和自定义标题ID的[标准链接]((/basic-syntax/links.html)，可以链接到文件中具有自定义ID的标题。

|Markdown|HTML|预览效果|
|---|---|---|
|`[Heading IDs](#heading-ids)`|`<a href="#heading-ids">Heading IDs</a>`|[Heading IDs](https://markdown.com.cn/extended-syntax/heading-ids.html#heading-ids)|

其他网站可以通过将自定义标题ID添加到网页的完整URL（例如`[Heading IDs](https://markdown.com.cn/extended-syntax/heading-ids.html#headid)`）来链接到标题。

# 四. 定义列表
一些Markdown处理器允许您创建术语及其对应定义的_定义列表_。
要创建定义列表，请在第一行上键入术语。在下一行，键入一个冒号，后跟一个空格和定义。
```
First Term
: This is the definition of the first term.

Second Term
: This is one definition of the second term.
: This is another definition of the second term.
```
对应HTML为：
```html
<dl>
  <dt>First Term</dt>
  <dd>This is the definition of the first term.</dd>
  <dt>Second Term</dt>
  <dd>This is one definition of the second term. </dd>
  <dd>This is another definition of the second term.</dd>
</dl>
```

# 五. 删除线
- 可以通过在单词中心放置一条水平线来删除单词。结果看起来~~像这样~~。
- 此功能使您可以指示某些单词是一个错误，要从文档中删除。
- 若要删除单词，请在单词前后使用两个波浪号`~~`。
```
~~世界是平坦的。~~ 我们现在知道世界是圆的。
```
示例输出为：
~~世界是平坦的。~~ 我们现在知道世界是圆的。

# 六. 任务列表
- 任务列表使您可以创建带有复选框的项目列表。
- 在支持任务列表的Markdown应用程序中，复选框将显示在内容旁边。要创建任务列表，请在任务列表项之前添加破折号`-`和方括号`[ ]`，并在`[ ]`前面加上空格。要选择一个复选框，请在方括号`[x]`之间添加 x 。
```
- [x] Write the press release
- [ ] Update the website
- [ ] Contact the media
```
示例输出为：
- [x] Write the press release
- [ ] Update the website
- [ ] Contact the media

# 七. 使用Emoji表情
## 1. 复制和粘贴表情符号
在大多数情况下，可以简单地从[Emojipedia (opens new window)](https://emojipedia.org/)等来源复制表情符号并将其粘贴到文档中。许多Markdown应用程序会自动以Markdown格式的文本显示表情符号。从Markdown应用程序导出的HTML和PDF文件应显示表情符号。

**Tip:** 如果您使用的是静态网站生成器，请确保将HTML页面编码为UTF-8。
## 2. 使用表情符号简码
一些Markdown应用程序允许您通过键入表情符号短代码来插入表情符号。这些以冒号开头和结尾，并包含表情符号的名称。
```
去露营了！ :tent: 很快回来。

真好笑！ :joy:
```
示例输出为：

去露营了！⛺很快回来。
真好笑！😂

**Note:** 注意：可以使用此[表情符号简码列表](https://gist.github.com/rxaviers/7360908)，但请记住，表情符号简码因应用程序而异。有关更多信息，请参阅Markdown应用程序的文档。

# 八. 自动网址链接
## 1. 自动网址链接
许多Markdown处理器会自动将URL转换为链接。这意味着如果您输入http://www.example.com，即使您未[使用方括号](https://markdown.com.cn/basic-syntax/links.html)，您的Markdown处理器也会自动将其转换为链接。
```
http://www.example.com
```
示例输出为：
http://www.example.com
## 2. 禁用自动URL链接
如果不希望自动链接URL，则可以通过将URL表示为带反引号的代码来删除该链接。
```
`http://www.example.com`
```
示例输出为
`http://www.example.com`