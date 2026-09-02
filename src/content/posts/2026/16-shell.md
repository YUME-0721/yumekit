---
title: Linux 环境下 Shell 编程全指南：从核心语法、高级特性到企业级运维自动化实战
published: 2026-06-06T00:00:00
description: 系统梳理 Linux 环境下 Shell/Bash 脚本编程的核心知识体系。从 Shell 基础概念与执行机制切入，详解变量、运算符、流程控制、函数与高级参数扩展，深入剖析防御性编程（set -euo pipefail）、信号捕获（trap）与文本三剑客（grep/sed/awk），并提供主机巡检、数据库自动备份、日志切分与守护告警等企业级运维实战脚本及高频避坑指南。
tags:
  - Linux
  - 运维
  - Shell
  - Bash
  - 自动化脚本
category: Linux运维
image: https://img.072199.xyz/file/blog/1788017336035.png
pinned: false
---

## 📌 什么是 Shell？核心概念与运行机制

在 Linux/Unix 操作系统中，**Shell（外壳）** 扮演着用户与操作系统内核（Kernel）之间沟通的**命令语言解释器（Interpreter）**角色。

```text
+-------------------------------------------------------------+
|                     User / Ops Script                       |
+-------------------------------------------------------------+
                              │ (1) 输入命令 / 运行脚本
                              ▼
+-------------------------------------------------------------+
|                 Shell (bash / zsh / sh)                     |
|        解释器、环境变量、语法解析、管道与重定向调度         |
+-------------------------------------------------------------+
                              │ (2) 系统调用 (System Call)
                              ▼
+-------------------------------------------------------------+
|                     Linux Kernel (内核)                     |
|           进程调度、内存管理、文件系统、设备驱动            |
+-------------------------------------------------------------+
                              │ (3) 硬件指令驱动
                              ▼
+-------------------------------------------------------------+
|                   Hardware (CPU / 内存 / 磁盘)              |
+-------------------------------------------------------------+
```

### 1. Shell 的两大核心形态

1. **交互式命令行（Interactive Shell）**：用户在终端敲下一条命令，Shell 解析后立即调用系统内核执行，并实时将结果打印在屏幕上（如 `ls`、`top`、`systemctl status nginx`）。
2. **批处理脚本（Shell Script）**：将预设的一系列 Linux 命令按照逻辑控制（条件分支、循环、函数）组织保存在文本文件中，由 Shell 批量自动解析执行，是 **DevOps 与 Linux 自动化运维的基石**。

---

### 2. 常见 Shell 种类与选型

Linux 支持多种 Shell，可通过 `cat /etc/shells` 查看当前系统支持的列表：

| Shell 类型 | 描述与典型场景 |
| :--- | :--- |
| **`sh` (Bourne Shell)** | Unix 最初的标准 Shell，POSIX 标准基础，语法通用但功能偏弱。 |
| **`bash` (Bourne Again Shell)** | **绝大多数 Linux 发行版（CentOS, Ubuntu, Debian, Rocky, RHEL）的默认 Shell**。向下兼容 sh，拥有强大的历史记录、补全、别名与数组功能。**企业运维开发绝对首选**。 |
| **`dash` (Debian Almquist Shell)** | 体积极小、启动速度极快，在 Ubuntu/Debian 中作为 `/bin/sh` 的软链接，专用于引导系统核心服务，但不支持 Bash 的许多高级语法。 |
| **`zsh` (Z Shell)** | 交互体验极佳（配合 Oh-My-Zsh 插件与主题），常用于个人开发工作站、macOS 默认终端。运维自动化仍优先写 Bash。 |

> [!TIP]
> 查看当前终端正在运行的 Shell：
> ```bash
> echo $SHELL
> ```

---

### 3. 什么是 Shebang（释伴）？

在每一个 Shell 脚本文件的**第一行第一列**，必须指定解释器路径，这被称为 **Shebang**（`#!`）：

```bash
#!/bin/bash
```

或者使用更加灵活的动态寻址写法：

```bash
#!/usr/bin/env bash
```

- **执行原理**：当操作系统内核通过可执行权限（`execve` 系统调用）运行该文件时，读取前两个字节为 `#!`，便知道该文件不是二进制 ELF 程序，而是脚本文本，内核会直接启动 Shebang 后指定的解释器程序，并将本脚本路径作为参数传入。
- **`/bin/bash` vs `#!/usr/bin/env bash`**：
  - `/bin/bash`：硬编码标准路径，在几乎所有常见 Linux 发行版上一致。
  - `/usr/bin/env bash`：通过 `env` 在系统的 `$PATH` 环境变量中动态查找 `bash`，在 BSD、macOS 或自定义安装 bash 路径（如 `/usr/local/bin/bash`）的多平台环境下兼容性更佳。

---

### 4. 脚本执行的 4 种方式与子进程隔离机制

编写一个简单的测试脚本 `hello.sh`：

```bash title="hello.sh"
#!/bin/bash
NAME="Linux-Server"
echo "Current PID: $$, Host: $NAME"
```

| 执行方式 | 命令示例 | 权限要求 | 进程环境（子 Shell 还是当前 Shell？） |
| :--- | :--- | :--- | :--- |
| **路径直执** | `./hello.sh` 或 `/data/hello.sh` | **必须有执行权限**（`chmod +x hello.sh`） | 开启 **新的子进程（Child Shell）** 执行，内部变量无法影响当前父终端。 |
| **解释器执行** | `bash hello.sh` 或 `sh hello.sh` | 仅需**读权限**（`chmod +r hello.sh`） | 开启 **新的子进程** 执行，脚本内变量退出后销毁。 |
| **Source 执行** | `source hello.sh` | 仅需**读权限** | **在当前终端 Shell 进程中直接执行**！脚本内定义的变量直接写入当前终端环境变量。 |
| **点号执行** | `. hello.sh` | 仅需**读权限** | 功能与 `source` 完全等价（POSIX 规范标准）。 |

> [!IMPORTANT]
> - 修改了 `/etc/profile` 或 `~/.bashrc` 后，为什么必须执行 `source ~/.bashrc`？因为只有 `source` 才能让环境变量在**当前会话**直接生效，若用 `bash ~/.bashrc` 则只会影响瞬间退出的子进程！

---

## 🧱 一、Shell 核心基础语法

### 1. 变量定义、引用与命名规范

#### (1) 变量赋值规范
- 格式：`变量名=值`
- **严禁在等号 `=` 两侧加空格**（如 `NAME = abc` 会被 Bash 误判为执行名为 `NAME` 的命令并将 `=` 和 `abc` 作为参数！）。
- 变量名区分大小写，由字母、数字、下划线组成，不能以数字开头。通常自定义局部变量推荐使用小写或驼峰（如 `app_dir`），环境全局变量全大写（如 `APP_HOME`）。

```bash title="变量定义与引用"
# 1. 基础赋值
APP_NAME="nginx-proxy"
PORT=8080

# 2. 变量引用（推荐使用 ${VAR} 规范写法，防止边界粘连）
echo "App is: $APP_NAME, Port: $PORT"
echo "Log file: ${APP_NAME}_access.log"   # 若不加括号写成 $APP_NAME_access 则会被识别为未定义的变量 $APP_NAME_access

# 3. 单引号 vs 双引号区别
VAR="World"
echo 'Hello $VAR'  # 输出原样字符串: Hello $VAR （强引用，转义失效）
echo "Hello $VAR"  # 输出解析后内容: Hello World （弱引用，变量/命令替换生效）
```

#### (2) 命令替换（反引号 vs `$()`）
将命令的标准输出结果赋值给变量：

```bash title="命令替换"
# 推荐写法: $(command) 支持嵌套
CURRENT_DATE=$(date +%Y%m%d_%H%M%S)
SYSTEM_IP=$(hostname -I | awk '{print $1}')

# 传统写法: `command`（不推荐，反引号容易看错且嵌套复杂）
SYS_LOAD=`uptime | awk -F 'load average:' '{print $2}'`

echo "Server IP: ${SYSTEM_IP} at ${CURRENT_DATE}"
```

#### (3) 变量作用域与清理
```bash
# 局部变量（仅当前 Shell 有效）
TEMP_DIR="/tmp/data"

# 导出为环境变量（子进程均可继承）
export APP_ENV="production"

# 只读变量（不可修改，不可 unset）
readonly DB_PORT=3306

# 删除变量
unset TEMP_DIR
```

---

### 2. 特殊预定义变量（位置参数）

在运维脚本编写中，命令行参数解析最为常用：

| 特殊变量 | 含义与说明 |
| :--- | :--- |
| **`$0`** | 当前正在执行的脚本名称或调用路径（如 `./deploy.sh`）。 |
| **`$1` ~ `$9`** | 传递给脚本或函数的第 1 到第 9 个位置参数。 |
| **`${10}`** | 第 10 个及以上的参数**必须加花括号**（否则 `$10` 会被识别为 `$1` 后面拼个数字 0）。 |
| **`$#`** | 传递给脚本或函数的**参数总个数**。常用于校验参数是否足够。 |
| **`$*`** | 传递的所有参数构成的单一字符串（`"$1 $2 $3..."`）。 |
| **`$@`** | 传递的所有参数构成的独立列表（`"$1" "$2" "$3"...`）。**绝大多数遍历循环务必用 `"$@"`**。 |
| **`$?`** | **上一条命令执行后的退出状态码（Exit Status）**：`0` 代表执行成功，非 `0` 代表发生异常。 |
| **`$$`** | 当前 Shell 脚本运行时的进程 ID（PID）。常用作临时文件防冲突后缀（如 `/tmp/app_$$.tmp`）。 |
| **`$!`** | 后台运行的最后一个进程的 PID。 |

#### `$*` 与 `$@` 的核心差异验证

```bash title="arg_test.sh"
#!/bin/bash
echo "=== 演示 \"\$*\" ==="
for arg in "$*"; do
    echo "Param: $arg"
done

echo "=== 演示 \"\$@\" ==="
for arg in "$@"; do
    echo "Param: $arg"
done
```

```bash title="执行与输出对比"
$ bash arg_test.sh "hello world" "ops" "2026"
=== 演示 "$*" ===
Param: hello world ops 2026   # 作为一个整体单个字符串展开

=== 演示 "$@" ===
Param: hello world            # 保持原始传入时的独立元素
Param: ops
Param: 2026
```

---

### 3. 输入输出重定向与管道

Linux 一切皆文件，每个进程启动时默认打开三个标准文件描述符（File Descriptor）：
- **`0`：标准输入（stdin）**，默认键盘。
- **`1`：标准输出（stdout）**，默认屏幕终端。
- **`2`：标准错误（stderr）**，默认屏幕终端。

```text
        +-----------------------------------------+
        |                 Process                 |
        |                                         |
0 ----->| 标准输入 (stdin)                        |
        |                        标准输出 (stdout)|-----> 1
        |                        标准错误 (stderr)|-----> 2
        +-----------------------------------------+
```

#### (1) 重定向符号表

```bash title="重定向高频用法"
# 1. 覆盖写入与追加写入
echo "System initialized" > /var/log/app.log   # 覆盖标准输出 (1>)
echo "New task started" >> /var/log/app.log    # 追加标准输出 (1>>)

# 2. 仅重定向错误信息
ls /not_exist_folder 2> /tmp/error.log         # 将错误信息重定向到 error.log

# 3. 正确日志与错误日志分流
./run_service.sh > /tmp/access.log 2> /tmp/error.log

# 4. 同时合并标准输出与标准错误（企业运维最通用做法）
# 经典 POSIX 兼容写法:
./backup.sh > /var/log/backup.log 2>&1
# Bash 4+ 简写写法:
./backup.sh &> /var/log/backup.log

# 5. 静音执行（丢弃所有屏幕输出信息）
crontab_job.sh >/dev/null 2>&1
```

#### (2) Here Document（`<<EOF` 多行文本输入）

常用于在 Shell 中快速输出配置文档或生成配置文件：

```bash title="生成配置文件范例"
#!/bin/bash
CONF_FILE="/etc/nginx/conf.d/status.conf"

cat << 'EOF' > "$CONF_FILE"
server {
    listen 8081;
    server_name 127.0.0.1;

    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
EOF

echo "Config $CONF_FILE generated successfully."
```

> [!NOTE]
> 如果 `<<EOF` 中的 `EOF` 加了单引号（如 `<< 'EOF'`），则内部文本中的 `$VAR` 不会被解析替换；如果不加引号，则内部变量会被求值替换。

#### (3) 管道与 `tee` 命令
管道符 `|` 将前一个命令的标准输出直接作为后一个命令的标准输入。  
若既想在屏幕查看，又想同时落盘到日志文件，使用 `tee`：

```bash
# -a 表示追加（append）
df -h | grep '/dev/mapper' | tee -a /tmp/disk_check.log
```

---

### 4. 数值运算操作

Shell 默认将所有变量值视为**字符串**。进行四则运算有多种方式：

```bash title="运算方法对比"
A=10
B=3

# 推荐 1: $(( 表达式 )) —— 语法直观，支持位运算、取模，执行速度最快
SUM=$(( A + B ))
MOD=$(( A % B ))
EXP=$(( A ** 2 ))  # 10的平方: 100
echo "SUM: $SUM, MOD: $MOD, EXP: $EXP"

# 推荐 2: let 命令 —— 适用于自增、自减
let A+=1
let B++
echo "A: $A, B: $B"

# 3. 浮点数运算（$(( )) 仅支持整数截断，浮点计算依赖 bc 或 awk）
# 使用 bc 计算保留两位小数:
PERCENT=$(echo "scale=2; 100 / 3" | bc)
echo "Percent: ${PERCENT}%"  # 33.33%

# 使用 awk 进行高精度运算:
AVG=$(awk 'BEGIN{printf "%.2f\n", 45 / 7}')
echo "Average: $AVG"         # 6.43
```

---

## ⚙️ 二、流程控制与分支结构

### 1. 条件测试语法：`test` vs `[ ]` vs `[[ ]]`

在条件判断中，有三种写法，**现代 Bash 脚本强烈推荐使用 `[[ ]]`**：

| 特性 / 区别 | `[ ]`（单中括号 / test 命令） | `[[ ]]`（双中括号 / Bash 关键字） |
| :--- | :--- | :--- |
| **标准类型** | POSIX 传统外部命令 | Bash 内置关键字 |
| **变量未引用问题** | 若 `$VAR` 为空，易引发 `[: =: unary operator expected` 语法崩溃 | **自动防空变量**，无需担心 `$VAR` 为空报错 |
| **逻辑运算符** | 必须使用 `-a`（与）、`-o`（或） | 支持标准的 `&&`（与）、`||`（或） |
| **字符串模式与正则** | 不支持正则匹配 | **原生支持正则表达式 `[[ "$str" =~ ^[0-9]+$ ]]`** 及通配符 |
| **大于/小于符号** | `<` 和 `>` 会被误判为重定向，必须转义 `\<` | 直接支持 `<` 和 `>` 按字典序比较 |

#### (1) 常用测试条件速查

```bash title="判断条件清单"
# --- 文件属性判断 ---
[ -e "/data/app" ]    # 目标是否存在 (Exist)
[ -f "/data/app.jar" ]# 目标存在且是普通文件 (File)
[ -d "/var/log" ]     # 目标存在且是目录 (Directory)
[ -s "/tmp/err.log" ] # 目标存在且大小大于 0 (Size > 0)
[ -r "$FILE" ]        # 当前用户是否具备读权限 (Readable)
[ -w "$FILE" ]        # 当前用户是否具备写权限 (Writable)
[ -x "$SCRIPT" ]      # 当前用户是否具备执行权限 (eXecutable)

# --- 字符串判断 ---
[ -z "$VAR" ]         # 字符串为空（Zero length）
[ -n "$VAR" ]         # 字符串非空（Not zero）
[ "$STR1" == "$STR2" ]# 两字符串完全相等（在 [[ ]] 中可用 == 或 =）
[ "$STR1" != "$STR2" ]# 两字符串不相等

# --- 整数比较 ---
[ "$A" -eq "$B" ]     # 等于 (Equal)
[ "$A" -ne "$B" ]     # 不等于 (Not Equal)
[ "$A" -gt "$B" ]     # 大于 (Greater Than)
[ "$A" -ge "$B" ]     # 大于等于 (Greater Equal)
[ "$A" -lt "$B" ]     # 小于 (Less Than)
[ "$A" -le "$B" ]     # 小于等于 (Less Equal)
```

---

### 2. 条件分支语句

#### (1) `if-elif-else` 结构

```bash title="check_disk.sh"
#!/bin/bash
# 检查根分区使用率
DISK_USAGE=$(df / | awk 'NR==2 {gsub("%",""); print $5}')

if [[ -z "$DISK_USAGE" ]]; then
    echo "Error: Failed to obtain disk usage."
    exit 1
fi

if [[ "$DISK_USAGE" -ge 90 ]]; then
    echo "CRITICAL: Root disk usage is ${DISK_USAGE}%! Immediate action required!"
elif [[ "$DISK_USAGE" -ge 75 ]]; then
    echo "WARNING: Root disk usage is ${DISK_USAGE}%, please clean up logs."
else
    echo "HEALTHY: Root disk usage is ${DISK_USAGE}%."
fi
```

#### (2) `case in esac` 结构（服务管理标准范式）

`case` 适合多分支精确匹配或通配符匹配，常用于编写 SystemV 服务管理脚本：

```bash title="service_manager.sh"
#!/bin/bash

ACTION="$1"
SERVICE_NAME="myapp"
PID_FILE="/var/run/${SERVICE_NAME}.pid"

case "$ACTION" in
    start)
        echo "Starting $SERVICE_NAME..."
        # 模拟启动逻辑
        ;;
    stop)
        echo "Stopping $SERVICE_NAME..."
        # 模拟停止逻辑
        ;;
    restart|reload)
        echo "Restarting $SERVICE_NAME..."
        $0 stop
        sleep 2
        $0 start
        ;;
    status)
        if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
            echo "$SERVICE_NAME is running with PID $(cat "$PID_FILE")."
        else
            echo "$SERVICE_NAME is stopped."
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 2
        ;;
esac
```

---

### 3. 循环结构与迭代

#### (1) `for` 循环

```bash title="for 循环多种形式"
# 1. 遍历已知列表
for env in dev test staging prod; do
    echo "Deploying to cluster: $env"
done

# 2. 批量处理命令结果或通配符文件
for conf in /etc/nginx/conf.d/*.conf; do
    [[ -f "$conf" ]] || continue
    echo "Found config: $conf"
done

# 3. 整数序列遍历（Bash 花括号展开）
for i in {1..5}; do
    echo "Retry attempt: $i"
done

# 4. C 语言风格的三元表达式循环
for ((i=1; i<=3; i++)); do
    echo "Current counter: $i"
done
```

#### (2) `while` 循环与【按行读取文件的黄金标准】

在运维中，批量处理 IP 列表、服务器清单、日志文件是最常见的场景。**千万不要用 `for line in $(cat file)`**（会被空格和换行错误分词）！

```bash title="逐行读取文件正确示范"
#!/bin/bash
# 格式: while IFS= read -r line; do ... done < file
# IFS= 清空行首行尾空白字符
# -r 防止反斜杠 '\' 转义字符被破坏

HOST_LIST="/etc/hosts.list"

if [[ ! -f "$HOST_LIST" ]]; then
    echo "Config file $HOST_LIST not found."
    exit 1
fi

while IFS= read -r ip || [[ -n "$ip" ]]; do
    # 忽略空行和注释行
    [[ -z "$ip" || "$ip" =~ ^# ]] && continue

    echo -n "Checking connectivity to $ip ... "
    if ping -c 1 -W 1 "$ip" >/dev/null 2>&1; then
        echo "[OK]"
    else
        echo "[FAILED]"
    fi
done < "$HOST_LIST"
```

---

## 🚀 三、Shell 高级特性与进阶技巧

### 1. 函数定义与变量作用域隔离

函数在 Shell 脚本中可实现业务逻辑模块化：

```bash title="函数定义与 local 隔离"
#!/bin/bash

# 1. 函数声明（推荐不用 function 关键字，更加 POSIX 兼容）
log_msg() {
    # 强烈注意: 必须在内部使用 local 关键字声明局部变量！
    # 如果不加 local，LEVEL 和 MSG 会变成全局变量，引发隐蔽 BUG
    local LEVEL="$1"
    local MSG="$2"
    local TIMESTAMP
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

    case "$LEVEL" in
        INFO)  echo -e "\033[32m[INFO]\033[0m  [$TIMESTAMP] $MSG" ;;
        WARN)  echo -e "\033[33m[WARN]\033[0m  [$TIMESTAMP] $MSG" ;;
        ERROR) echo -e "\033[31m[ERROR]\033[0m [$TIMESTAMP] $MSG" >&2 ;;
    esac
}

# 2. 函数的返回值
# 注意: return 只能返回 0-255 的整数状态码，通常表示成功(0)或失败(!0)
# 若需返回字符串结果，使用 echo 打印并通过命令替换 $() 捕获
calculate_memory_usage() {
    local used_mem
    used_mem=$(free -m | awk '/Mem:/ {print $3}')
    echo "$used_mem"
}

# 调用
log_msg "INFO" "Script initialization started..."
MEM_USED=$(calculate_memory_usage)
log_msg "WARN" "Current memory used: ${MEM_USED}MB"
```

---

### 2. 数组与关联数组（Bash 4+ 字典）

#### (1) 普通索引数组

```bash title="普通数组操作"
# 1. 定义数组
SERVERS=("192.168.1.10" "192.168.1.11" "192.168.1.12")

# 2. 追加元素
SERVERS+=("192.168.1.13")

# 3. 访问指定元素
echo "First server: ${SERVERS[0]}"

# 4. 获取数组所有元素
echo "All servers: ${SERVERS[@]}"

# 5. 获取数组长度（元素个数）
echo "Total count: ${#SERVERS[@]}"

# 6. 遍历数组
for s in "${SERVERS[@]}"; do
    echo "Deploying agent on: $s"
done
```

#### (2) 关联数组（键值对 Key-Value）

```bash title="关联数组操作"
# 必须显式使用 declare -A 声明关联数组
declare -A PORT_MAP

PORT_MAP["http"]=80
PORT_MAP["https"]=443
PORT_MAP["ssh"]=22
PORT_MAP["mysql"]=3306

# 查找键对应的值
echo "SSH Port is: ${PORT_MAP["ssh"]}"

# 遍历所有的键（通过 ! 提取所有 Key）
for service in "${!PORT_MAP[@]}"; do
    echo "Service: $service -> Port: ${PORT_MAP[$service]}"
done
```

---

### 3. 字符串切片与高级参数扩展（Parameter Expansion）

掌握参数扩展，能够省去频繁调用 `cut`、`sed`、`awk` 的开销，直接在 Bash 内部完成高性能字符串清洗：

| 表达式 | 描述 | 示例（假设 `FILE="backup_2026_db.tar.gz"`） | 结果 |
| :--- | :--- | :--- | :--- |
| **`${#var}`** | 获取字符串长度 | `${#FILE}` | `21` |
| **`${var:offset:length}`**| 字符串切片截取 | `${FILE:0:6}` | `backup` |
| **`${var#pattern}`** | 从左向右匹配，删除**最短**匹配前缀 | `${FILE#*_}` | `2026_db.tar.gz` |
| **`${var##pattern}`**| 从左向右匹配，删除**最长**匹配前缀 | `${FILE##*_}` | `db.tar.gz` |
| **`${var%pattern}`** | 从右向左匹配，删除**最短**匹配后缀 | `${FILE%.*}` | `backup_2026_db.tar` |
| **`${var%%pattern}`**| 从右向左匹配，删除**最长**匹配后缀 | `${FILE%%.*}` | `backup_2026_db` |
| **`${var/old/new}`** | 替换第一个匹配的子串 | `${FILE/backup/archive}` | `archive_2026_db.tar.gz` |
| **`${var//old/new}`**| 替换所有匹配的子串 | `${FILE//_/--}` | `backup--2026--db.tar.gz` |

#### 变量默认值与保底机制

```bash title="默认值处理技巧"
# 1. 若变量未定义或为空，则返回默认值（不修改变量自身）
BACKUP_PATH="${USER_PATH:-/data/backup}"

# 2. 若变量未定义或为空，则将默认值赋值给该变量
APP_PORT="${PORT:=8080}"

# 3. 校验强制变量：若未设置则抛出错误并退出脚本（非常适合关键参数校验）
CONFIG_ENV="${TARGET_ENV:?Error: TARGET_ENV must be specified!}"
```

---

### 4. 信号捕获与优雅退出守护（`trap`）

运维脚本执行过程中，如果管理员按下 `Ctrl+C`（`SIGINT`）或服务中断（`SIGTERM`），往往会留下半途生成的临时文件或锁文件，导致下次任务运行报锁冲突。使用 `trap` 可以捕获信号并执行清理钩子：

```bash title="trap 捕获退出清理示范"
#!/bin/bash
# 创建临时目录
TMP_DIR=$(mktemp -d /tmp/app_batch_XXXXXX)
LOCK_FILE="/var/run/app_batch.lock"

# 检查互斥锁，避免重复执行
if [[ -e "$LOCK_FILE" ]]; then
    echo "Task is already running. Exiting."
    exit 1
fi
touch "$LOCK_FILE"

# 注册清理函数：无论脚本正常退出 (EXIT)、被中断 (SIGINT=2) 还是被终止 (SIGTERM=15)，均触发
cleanup() {
    local exit_code=$?
    echo -e "\nCaught signal or script exiting. Cleaning up temporary resources..."
    rm -rf "$TMP_DIR"
    rm -f "$LOCK_FILE"
    echo "Cleanup complete. Exit code: $exit_code"
    exit "$exit_code"
}
trap cleanup EXIT INT TERM

echo "Processing tasks in $TMP_DIR ..."
sleep 10
echo "Task completed successfully."
```

---

### 5. 防御性编程：严苛模式（`set -euo pipefail`）

在生产环境下编写 Bash 脚本时，强烈推荐在脚本开头引入以下配置。这是避免灾难事故（如 `rm -rf $DIR/` 变量未定义变 `rm -rf /`）的第一防线：

```bash title="严格模式推荐配置"
#!/usr/bin/env bash
set -euo pipefail
```

* **`set -e` (errexit)**：任何一行命令返回非 0 状态码时，立即中止脚本执行，防止错误雪崩级扩大。
* **`set -u` (nounset)**：当尝试使用未初始化的变量时，立即抛错并退出脚本（防止变量名拼写错误）。
* **`set -o pipefail`**：在管道命令中（例如 `cmd1 | cmd2 | cmd3`），默认退出码由最后一个命令 `cmd3` 决定。启用该选项后，**只要管道链路中任意一个命令失败，整个管道即视为失败**。

> [!CAUTION]
> 当启用了 `set -e` 时，遇到预料中的非 0 返回（例如 `grep "not_found" file.txt`）会导致整个脚本意外退出。此时应通过 `|| true` 或 `if grep ...` 显式豁免：
> ```bash
> # 即使 grep 返回 1 也不会导致脚本崩溃中断
> grep "CRITICAL" /var/log/app.log || true
> ```

---

## 🛠️ 四、文本处理三剑客与运维组合拳

在 Linux 运维领域，数据流分析与日志抓取离不开“文本三剑客”：**`grep`（行过滤）、`sed`（行编辑与替换）、`awk`（列格式化与报表统计）**。

```text
+---------+         +---------+         +---------+
|  grep   | ------> |   sed   | ------> |   awk   |
| 筛选匹配行|         | 修改替换内容|       | 提取列与计算统计|
+---------+         +---------+         +---------+
```

### 1. Grep（文本检索与过滤）

```bash title="grep 运维高频命令"
# 1. 忽略大小写 (-i)，显示行号 (-n)
grep -in "error" /var/log/nginx/error.log

# 2. 反向排除 (-v) 注释行与空行（运维查看清爽配置文件的绝招）
grep -vE '^#|^$' /etc/redis/redis.conf

# 3. 统计匹配总行数 (-c)
grep -c "404" /var/log/nginx/access.log

# 4. 仅输出正则匹配到的确切部分 (-o)
# 提取文本中所有合法的 IPv4 地址:
grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' /var/log/secure
```

---

### 2. Sed（流编辑器与无交互配置替换）

`sed` 擅长按行或者模式匹配进行文本的增、删、改、查，尤其在 CI/CD 自动化部署时修改参数：

```bash title="sed 核心应用"
# 1. 全文替换并直接写回文件 (-i)
# 将端口 80 替换为 8080 (s/old/new/g)
sed -i 's/listen 80;/listen 8080;/g' /etc/nginx/nginx.conf

# 2. 如果替换内容中包含路径斜杠 '/'，使用 '#' 或 '@' 作为定界符避免转义
sed -i 's#root /var/www/html;#root /data/web;#g' /etc/nginx/nginx.conf

# 3. 删除特定行
sed -i '/^#/d' /tmp/app.conf       # 删除所有以 # 开头的行
sed -i '/^$/d' /tmp/app.conf       # 删除所有空行
sed -i '1,5d' /tmp/app.conf        # 删除前 5 行

# 4. 在匹配行后追加一行内容 (a)
sed -i '/\[mysqld\]/a max_connections = 1000' /etc/my.cnf
```

---

### 3. Awk（结构化数据分析与报表统计）

`awk` 是一门微型图灵完备的语言，以空格或指定字符为分隔符拆解行，默认 `$1` 为第 1 列，`$2` 为第 2 列，`$0` 为整行。

```bash title="awk 经典运维统计"
# 1. 自定义分隔符 (-F)，打印指定列
# 查看系统中 UID >= 1000 的普通用户:
awk -F: '$3 >= 1000 {print $1, "UID:", $3, "Shell:", $7}' /etc/passwd

# 2. 统计 Nginx 访问日志中访问量最高的 Top 10 IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -n 10

# 3. 求和计算: 统计当前系统所有 nginx 进程占用的物理内存(RSS)总和 (单位 MB)
ps aux | grep nginx | grep -v grep | awk '{sum += $6} END {printf "Total RSS: %.2f MB\n", sum/1024}'

# 4. 统计连接状态分布 (netstat / ss)
ss -ant | awk 'NR>1 {count[$1]++} END {for (state in count) print state, count[state]}'
```

---

## 💼 五、企业级运维自动化实战脚本

### 1. 实战一：服务器硬件健康状态全方位巡检脚本

该脚本自动巡检当前服务器的 CPU 负载、内存使用率、根分区与挂载分区磁盘占用率，并在超限时高亮预警：

```bash title="/opt/scripts/system_inspect.sh"
#!/usr/bin/env bash
# ==============================================================================
# Script Name : system_inspect.sh
# Description : Linux Host Resources & Health Patrol Script
# ==============================================================================
set -euo pipefail

# 阈值配置
CPU_LOAD_THRESHOLD=4.0
MEM_WARN_PERCENT=80
DISK_WARN_PERCENT=85

echo "========================================================"
echo "          Linux System Health Report - $(date '+%F %T')"
echo "========================================================"

# 1. 主机基本信息
HOSTNAME=$(hostname)
UPTIME=$(uptime -p)
IP_ADDR=$(hostname -I | awk '{print $1}')
echo "Host: $HOSTNAME | IP: $IP_ADDR | Uptime: $UPTIME"
echo "--------------------------------------------------------"

# 2. CPU 负载检查 (获取 1 分钟平均负载)
CPU_CORES=$(nproc)
LOAD_1MIN=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | tr -d ' ')
echo -n "CPU Cores: $CPU_CORES | 1-Min Load: $LOAD_1MIN ... "
if (( $(echo "$LOAD_1MIN > $CPU_LOAD_THRESHOLD" | bc -l) )); then
    echo -e "\033[31m[OVERLOAD]\033[0m"
else
    echo -e "\033[32m[OK]\033[0m"
fi

# 3. 内存使用率计算
MEM_TOTAL=$(free -m | awk '/Mem:/ {print $2}')
MEM_USED=$(free -m | awk '/Mem:/ {print $3}')
MEM_RATE=$(( MEM_USED * 100 / MEM_TOTAL ))
echo -n "Memory Usage: ${MEM_USED}MB / ${MEM_TOTAL}MB (${MEM_RATE}%) ... "
if [[ "$MEM_RATE" -ge "$MEM_WARN_PERCENT" ]]; then
    echo -e "\033[31m[HIGH]\033[0m"
else
    echo -e "\033[32m[OK]\033[0m"
fi

# 4. 磁盘各分区使用率检查
echo "--------------------------------------------------------"
echo "Disk Filesystems (Threshold: >= ${DISK_WARN_PERCENT}%):"
df -hP | awk 'NR>1 && $1 ~ /^\/dev/ {print $1, $5, $6}' | while read -r dev usage mount; do
    pct=$(echo "$usage" | tr -d '%')
    if [[ "$pct" -ge "$DISK_WARN_PERCENT" ]]; then
        echo -e "  \033[31m[CRITICAL]\033[0m $dev on $mount used ${pct}%"
    else
        echo -e "  \033[32m[NORMAL]\033[0m   $dev on $mount used ${pct}%"
    fi
done

# 5. 检查关键服务状态
SERVICES=("sshd" "docker" "nginx" "crond")
echo "--------------------------------------------------------"
echo "Core Systemd Services:"
for s in "${SERVICES[@]}"; do
    if systemctl is-active --quiet "$s" 2>/dev/null; then
        echo -e "  \033[32m[RUNNING]\033[0m $s"
    else
        echo -e "  \033[33m[INACTIVE/ABSENT]\033[0m $s"
    fi
done
echo "========================================================"
```

---

### 2. 实战二：MySQL 全量定时备份与滚动清理保留策略

该脚本实现针对 MySQL 数据库的全库热备份、`gzip` 压缩归档，自动清理 N 天之前的历史废弃备份，并记录完整操作日志：

```bash title="/opt/scripts/mysql_backup.sh"
#!/usr/bin/env bash
# ==============================================================================
# Script Name : mysql_backup.sh
# Description : MySQL Database Auto Dump with Compression & Log Rotation
# ==============================================================================
set -euo pipefail

# 配置项
DB_USER="root"
DB_PASS="YourSecurePassword123"
DB_HOST="127.0.0.1"
DB_PORT="3306"

BACKUP_DIR="/data/backup/mysql"
RETENTION_DAYS=7
DATE_STR=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/mysql_backup.log"

# 创建目录
mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting MySQL full backup..."

DUMP_FILE="${BACKUP_DIR}/all_databases_${DATE_STR}.sql.gz"

# 执行 mysqldump 备份并管道传给 gzip 实时压缩
if mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    --all-databases \
    --single-transaction \
    --quick \
    --events \
    --routines \
    --triggers 2>/dev/null | gzip > "$DUMP_FILE"; then
    
    FILE_SIZE=$(du -h "$DUMP_FILE" | awk '{print $1}')
    log "Backup successful: $DUMP_FILE (Size: $FILE_SIZE)"
else
    log "ERROR: mysqldump execution failed!"
    exit 1
fi

# 清理保留周期外的老旧备份文件（寻找以 .sql.gz 结尾且修改时间超过 7 天的文件）
log "Purging backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -exec rm -vf {} \; | while read -r removed; do
    log "Removed obsolete file: $removed"
done

log "Backup workflow finished."
```

---

### 3. 实战三：Nginx 访问日志按天切割与压缩归档脚本

防止单个 `access.log` 膨胀到几十 GB 导致检索缓慢、磁盘打爆：

```bash title="/opt/scripts/nginx_log_rotate.sh"
#!/usr/bin/env bash
# ==============================================================================
# Script Name : nginx_log_rotate.sh
# Description : Cut Nginx access.log daily and send USR1 signal to reload FD
# ==============================================================================
set -euo pipefail

LOGS_DIR="/var/log/nginx"
ARCHIVE_DIR="${LOGS_DIR}/history"
YESTERDAY=$(date -d "yesterday" +%Y%m%d)
PID_FILE="/var/run/nginx.pid"

mkdir -p "$ARCHIVE_DIR"

# 1. 重命名当前的访问日志和错误日志
if [[ -f "${LOGS_DIR}/access.log" ]]; then
    mv "${LOGS_DIR}/access.log" "${ARCHIVE_DIR}/access_${YESTERDAY}.log"
fi

if [[ -f "${LOGS_DIR}/error.log" ]]; then
    mv "${LOGS_DIR}/error.log" "${ARCHIVE_DIR}/error_${YESTERDAY}.log"
fi

# 2. 向 Nginx 主进程发送 USR1 信号，通知 Nginx 重新打开日志文件句柄并新建文件
if [[ -f "$PID_FILE" ]]; then
    kill -USR1 "$(cat "$PID_FILE")"
else
    echo "Nginx pid file not found. Reloading via systemctl..."
    systemctl reload nginx
fi

# 3. 压缩昨天切出来的日志文件
gzip -f "${ARCHIVE_DIR}/access_${YESTERDAY}.log"
gzip -f "${ARCHIVE_DIR}/error_${YESTERDAY}.log"

# 4. 删除保留周期（如 30 天）之外的压缩日志
find "$ARCHIVE_DIR" -type f -name "*.log.gz" -mtime +30 -delete

echo "Nginx logs rotated successfully for date: $YESTERDAY"
```

---

### 4. 实战四：服务故障保活与 Webhook（企业微信/飞书/钉钉）报警通知

模拟守护一个后端微服务，若检测到进程死掉则自动尝试拉起，并通过群机器人通知管理员：

```bash title="/opt/scripts/service_guardian.sh"
#!/usr/bin/env bash
# ==============================================================================
# Script Name : service_guardian.sh
# Description : Process Keep-Alive with Webhook Alert Notification
# ==============================================================================
set -euo pipefail

SERVICE_CMD="systemctl restart app-backend"
CHECK_PORT=8080
WEBHOOK_URL="https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN_HERE"

send_alert() {
    local text_content="$1"
    # 发送 HTTP POST JSON 请求
    curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"msgtype\": \"text\",
            \"text\": {
                \"content\": \"[Ops Alert] Server $(hostname -I | awk '{print $1}')\n${text_content}\"
            }
        }" >/dev/null 2>&1 || true
}

# 探测本地端口是否处于 LISTEN 状态
if ! nc -z -w 3 127.0.0.1 "$CHECK_PORT" 2>/dev/null; then
    echo "Warning: Port $CHECK_PORT is DOWN. Restarting service..."
    
    # 尝试拉起
    $SERVICE_CMD
    sleep 5

    # 二次复测
    if nc -z -w 3 127.0.0.1 "$CHECK_PORT" 2>/dev/null; then
        send_alert "Service on port $CHECK_PORT died but was successfully RECOVERED by watchdog."
    else
        send_alert "CRITICAL: Service on port $CHECK_PORT failed to start! Manual intervention needed immediately."
    fi
fi
```

---

## ⚠️ 六、Shell 运维高频避坑指南

### 1. 坑一：变量未加双引号导致的分词与通配符展开（Word Splitting）

这是 Shell 史上最著名的隐患来源：

```bash
TARGET_DIR="/data/my files"

# 错误写法:
rm -rf $TARGET_DIR/*
# Bash 会将其展开为两个独立的参数执行: rm -rf /data/my files/*
# 导致误删当前目录下的 files 文件夹！

# 正确写法: 引用变量永远带上双引号！
rm -rf "$TARGET_DIR"/*
```

---

### 2. 坑二：Windows CRLF 换行符导致的 `\r: command not found`

在 Windows 机器上编辑 Shell 脚本并上传到 Linux 服务器执行时，常出现诡异报错：
```text
-bash: ./deploy.sh: /bin/bash^M: bad interpreter: No such file or directory
syntax error near unexpected token `$'do\r''
```

- **原因**：Windows 换行符是 `CRLF`（`\r\n`），而 Linux 换行符是 `LF`（`\n`）。Linux 将不可见的 `\r` 视作普通字符，导致解释器变成了 `/bin/bash\r`。
- **解决方式**：
  ```bash
  # 安装并运行 dos2unix
  dos2unix deploy.sh
  
  # 或者使用 sed 快速替换掉 \r
  sed -i 's/\r$//' deploy.sh
  ```

---

### 3. 坑三：管道子 Shell 环境变量丢失之谜

许多新手常常困惑于以下循环结束后变量为空的问题：

```bash
COUNT=0
cat /etc/passwd | while read -r line; do
    let COUNT++
done
echo "Total users: $COUNT"  # 输出依然是 0！
```

- **原因**：管道符号 `|` 后面的 `while` 循环实际上被放在了**一个独立的子 Shell 进程**中运行。子进程内部修改的 `COUNT` 无法回写给父进程。
- **正解（使用输入重定向，避免管道子 Shell）**：
  ```bash
  COUNT=0
  while read -r line; do
      let COUNT++
  done < /etc/passwd
  echo "Total users: $COUNT"  # 正确输出实际行数！
  ```

---

### 4. 坑四：并发控制与限流机制（FIFO 命名管道令牌桶）

如果需要批量处理 100 台主机的巡检或备份，简单地在循环后加 `&`（`ssh $ip ... &`）会瞬间产生 100 个后台并发进程，瞬间耗尽系统的 CPU、文件句柄和内存。

**使用命名管道（FIFO）实现固定并发池（例如限制只允许 5 个并发）**：

```bash title="concurrency_pool.sh"
#!/usr/bin/env bash
set -euo pipefail

PARALLEL_LIMIT=5
TMP_FIFO="/tmp/fd1_$$.fifo"

# 1. 创建命名管道并关联到文件描述符 6
mkfifo "$TMP_FIFO"
exec 6<>"$TMP_FIFO"
rm -f "$TMP_FIFO"

# 2. 预先往管道里灌入 5 个令牌（换行符）
for ((i=0; i<PARALLEL_LIMIT; i++)); do
    echo >&6
done

# 3. 模拟 20 个耗时任务
for taskId in {1..20}; do
    # 从管道获取令牌（若管道为空，read 会自动阻塞等待）
    read -u 6

    {
        echo "Starting task $taskId on worker PID: $$"
        sleep 2
        echo "Finished task $taskId"

        # 任务执行完成后，归还令牌
        echo >&6
    } &
done

# 4. 等待所有后台子任务完全结束
wait
# 关闭并释放描述符
exec 6>&-

echo "All 20 tasks completed safely with max concurrency: $PARALLEL_LIMIT."
```

---

## 📋 附录：Shell 运维高频命令与特殊语法速查卡

```text
+---------------------+---------------------------------------------------------+
| 语法 / 变量         | 说明与典型范例                                          |
+---------------------+---------------------------------------------------------+
| $?                  | 上条命令状态码 (0 为成功, 非 0 为失败)                   |
| $#                  | 命令行入参总个数                                        |
| "$@"                | 所有位置参数展开为独立双引号字符串                      |
| ${var:-default}     | 若 var 为空则取 default                                  |
| ${var#*pattern}     | 从左侧删除最短匹配                                      |
| ${var%pattern*}     | 从右侧删除最短匹配                                      |
| 2>&1                | 将标准错误(2)重定向到标准输出(1)                        |
| >/dev/null 2>&1     | 丢弃所有屏幕输出 (静默执行)                             |
| while read -r line  | 逐行读取文件的标准范式                                  |
| set -euo pipefail   | 生产级脚本严格保护模式 (防未定义变量与静默失败)          |
| trap cleanup EXIT   | 退出信号捕获钩子 (自动清理临时文件)                     |
| sed -i 's/a/b/g' f  | 原地替换文件文本                                        |
| awk '{print $1}' f  | 提取以空格/制表符分割的第 1 列                          |
+---------------------+---------------------------------------------------------+
```
