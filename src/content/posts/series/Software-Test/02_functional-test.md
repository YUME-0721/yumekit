---
title: 软件功能/非功能测试
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
![电商系统 | width=70%](../../../assets/images/02_functional-test.png)

## 需求分析
![登录的需求分析 | width=70%](../../../assets/images/02_functional-test-1.png)

分析：
1. 账号：已注册手机号、已注册邮箱、为空、未注册手机号（电信、移动、联通）和邮箱是否都要覆盖？
2. 密码：注册密码、为空、错误密码（写纯数字还是纯字母）？
3. 验证码：正确、过期、错误
## 等价类划分
一种用<font color="red">少量数据</font>获得<font color="red">较好测试效果</font>的工具。
<strong>场景</strong>：表单类页面元素测试使用（输入框、下拉框、单选框、复选框）等。

![登录的需求分析 | width=70%](../../../assets/images/02_functional-test-2.png)

<strong>步骤：</strong>
1. 划分有效等价类：满足需求的数据集合。
2. 划分无效等价类：不满足需求的数据集合。
3. 每类中选取代表数据。

## 边界值分析法
![边界值分析法 | width=50%](../../../assets/images/02_functional-test-5.png)
- <strong>选取：</strong>
	1. 上点：刚好是边界上的点，必选（不考虑是否包含上点）100、300
	2. 离点：距离上点最近的点，选择2个（不包含上点选择范围内的点，包含上点选择范围外的点）99、301
	3. 内点：边界范围内的任意点，必选（建议选择中间范围）200
- <strong>步骤：</strong>
	1. 边界值分析（负责<font color="red">测试长度范围</font>）
	2. 划分等价类（负责测试<font color="red">类型</font>和<font color="red">规则</font>）
	3. 提取数据

# 非功能测试
非功能：除了软件功能测试，其他都是非功能测试。

## 非功能测试范围：
- 兼容性
- 易用性
- 安全性
- 性能
- 可移植性
- 可维护性
- 可靠性

## 非功能重点测试项
- 兼容性：Web项目测试浏览器兼容Chrome、Edge、FireFox、Safari等
- 易用性：参考竞品，主观感受为主