---
title: 软件功能测试
published: 2026-03-31T15:00:00
description: 软件测试
tags:
  - 软件测试
  - 学习
  - web测试
category: 软件测试
pinned: false
---
# 单功能
软件程序或应用程序只提供一项核心功能或特性，而不包含其他附加功能。如电商系统：
<img src="../../../assets/images/02_functional-test.png" width="70%" height="70%" alt="电商系统">

# 需求分析
<img src="../../../assets/images/02_functional-test-1.png" width="70%" height="70%" alt="登录的需求分析">

分析：
1. 账号：已注册手机号、已注册邮箱、为空、未注册手机号（电信、移动、联通）和邮箱是否都要覆盖？
2. 密码：注册密码、为空、错误密码（写纯数字还是纯字母）？
3. 验证码：正确、过期、错误
## 等价类划分
一种用<font color="red">少量数据</font>获得<font color="red">较好测试效果</font>的工具。
<strong>场景</strong>：表单类页面元素测试使用（输入框、下拉框、单选框、复选框）等。

<img src="../../../assets/images/02_functional-test-2.png" width="70%" height="70%" alt="登录的需求分析">

<strong>步骤：</strong>
1. 划分有效等价类：满足需求的数据集合。
2. 划分无效等价类：不满足需求的数据集合。
3. 每类中选取代表数据。

<img src="../../../assets/images/02_functional-test-4.png" width="50%" height="50%" alt="功能测试流程图">
