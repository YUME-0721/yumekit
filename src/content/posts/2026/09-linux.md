---
title: Linux 常用核心命令汇总与速查指南
published: 2026-04-24T00:00:00
description: 本文系统归纳了 Linux 运维与开发中最常用的核心命令，覆盖文件管理、用户权限、进程控制、网络配置、文本处理、系统状态、日志分析及包管理八操板块，提供高频参数与实战示例。
tags:
  - Linux
  - 操作系统
  - 运维
  - 命令行
category: Linux运维
image: https://img.072199.xyz/file/blog/1787583477037.png
pinned: false
---

在 Linux 系统的日常运维、服务器部署与开发工作中，熟练掌握常用的终端命令行工具是提高工作效率的关键。本文将 Linux 最核心的命令按功能划分为八大板块，整理出常用参数、高频使用场景与经典示例，方便日常开发与运维速查。

---

## 📌 核心命令速查总览表

| 类别 | 核心命令 | 主要用途说明 |
| :--- | :--- | :--- |
| **文件管理** | `ls`, `cd`, `mkdir`, `rm`, `cp`, `mv`, `find` | 目录浏览、文件增删改查与高级条件搜索 |
| **用户与权限** | `useradd`, `passwd`, `chmod`, `chown`, `sudo` | 用户账号管理、文件读写执行权限与 root 提权 |
| **进程管理** | `ps`, `top`/`htop`, `kill`, `systemctl` | 查看与终止进程、Systemd 系统服务状态管控 |
| **网络配置** | `ip`, `ping`, `ss`/`netstat`, `firewall-cmd` | 网络接口查询、连通性测试、端口监听与防火墙规则 |
| **文本处理** | `grep`, `awk`, `sed`, `cut`, `sort`, `uniq`, `wc` | 文本正则过滤、列提取、批量替换、排序去重与行数统计 |
| **系统查看** | `pwd`, `hostname`, `date`, `uname -r`, `free -h`, `df -h`, `du` | 当前路径、主机名、系统时间日期、内核版本、内存与磁盘容量查看 |
| **日志查看** | `journalctl`, `tail -f`, `/var/log` | Systemd 日志检索、文件末尾实时追踪与常用日志目录 |
| **包管理** | `yum`/`dnf` (CentOS/RHEL) / `apt` (Ubuntu/Debian) | 软件源更新、软件包安装/卸载与系统依赖维护 |

---

## 📂 1. 文件管理 (File Management)

文件与目录操作是 Linux 终端中最频繁的命令集合。

### 1.1 `ls` - 列出目录内容
* **常用选项**：
  * `-l`：以长格式（详细信息）显示，包含权限、所有者、大小和修改时间。
  * `-a`：显示所有文件，包含以 `.` 开头的隐藏文件。
  * `-h`：结合 `-l` 使用，以人类易读单位（KB、MB、GB）显示文件大小。
  * `-t`：按文件修改时间排序（最近修改在前）。
* **常用示例**：
  ```bash
  ls -lah          # 详细查看目录下所有文件（含隐藏文件），大小可读
  ls -lt /var/log  # 按修改时间倒序排列日志文件
  ```

### 1.2 `cd` - 切换工作目录
* **常用示例**：
  ```bash
  cd /var/www/html # 切换到绝对路径
  cd ~             # 进入当前用户的家目录（也可直接敲 cd）
  cd ..            # 返回上一级目录
  cd -             # 快速切换回上一次所在的目录
  ```

### 1.3 `mkdir` - 创建新目录
* **常用选项**：
  * `-p`：递归创建多级目录，如果父目录不存在也会一并创建。
* **常用示例**：
  ```bash
  mkdir my_folder
  mkdir -p project/src/components # 递归创建多层子目录
  ```

### 1.4 `rm` - 删除文件或目录
> [!CAUTION]
> `rm -rf` 属于高危操作，请务必确认删除路径后再执行！

* **常用选项**：
  * `-r`：递归删除目录及其内部所有内容。
  * `-f`：强制删除，不进行二次交互确认，忽略不存在的文件。
  * `-i`：删除每个文件前进行交互式询问。
* **常用示例**：
  ```bash
  rm old_file.txt        # 删除单个文件
  rm -rf /tmp/test_dir   # 强制递归删除指定目录
  ```

### 1.5 `cp` - 复制文件或目录
* **常用选项**：
  * `-r`：递归复制目录及其子文件/子目录。
  * `-p`：保留源文件的属性（时间戳、权限、所有者等）。
  * `-a`：归档模式复制，相当于 `-pdr`，常用于备份整个目录结构。
* **常用示例**：
  ```bash
  cp config.conf config.conf.bak   # 备份单个配置文件
  cp -r /app/src /app/src_backup  # 递归复制目录
  ```

### 1.6 `mv` - 移动或重命名文件/目录
* **常用示例**：
  ```bash
  mv old_name.txt new_name.txt     # 在同一目录下重命名文件
  mv data.csv /backup/data/        # 将文件移动到指定目标路径
  ```

### 1.7 `find` - 在指定路径下搜索文件
* **常用选项**：
  * `-name`：按文件名匹配（支持通配符 `*`）。
  * `-type`：按类型查找，`f` 表示普通文件，`d` 表示目录。
  * `-size`：按文件大小查找（如 `+100M` 大于 100M，`-10k` 小于 10k）。
  * `-mtime`：按修改时间查找（如 `-7` 7天内修改过，`+30` 30天前修改过）。
  * `-exec`：对找到的文件执行指定的 shell 命令。
* **常用示例**：
  ```bash
  find /var/log -name "*.log"                 # 查找 /var/log 下所有 .log 文件
  find /data -type f -size +500M              # 查找 /data 下大于 500MB 的文件
  find /tmp -type f -mtime +7 -exec rm -f {} \; # 查找 /tmp 下 7 天前的文件并删除
  ```

---

## 🔒 2. 用户与权限 (User & Permissions)

Linux 是多用户系统，严格控制文件的安全读取、写入与执行权限。

### 2.1 `useradd` - 创建新用户
* **常用选项**：
  * `-m`：自动创建用户的家目录 `/home/username`。
  * `-s`：指定用户的默认登录 Shell（如 `/bin/bash`）。
  * `-g`：指定用户的主用户组。
* **常用示例**：
  ```bash
  useradd -m -s /bin/bash deployer # 创建新运维用户 deployer 并生成家目录
  ```

### 2.2 `passwd` - 设置或修改用户密码
* **常用示例**：
  ```bash
  passwd           # 修改当前登录用户的密码
  passwd deployer  # (需 root 权限) 修改指定用户的密码
  ```

### 2.3 `chmod` - 更改文件或目录权限
* **权限符号表**：`r` (读=4), `w` (写=2), `x` (执行=1)。
* **常用示例**：
  ```bash
  chmod +x build.sh           # 为所有用户添加可执行权限
  chmod 755 /var/www/script   # 设为 rwxr-xr-x (所有者可读写执行，其他用户可读执行)
  chmod 644 config.json       # 设为 rw-r--r-- (所有者可读写，其他用户仅可读)
  chmod -R 755 /var/www/html  # 递归修改目录下所有文件及子目录权限
  ```

### 2.4 `chown` - 更改文件所有者与所属组
* **常用选项**：
  * `-R`：递归更改目录及其下所有文件/子目录的所有权。
* **常用示例**：
  ```bash
  chown www-data /var/www/html/index.html        # 修改文件所有者为 www-data
  chown -R nginx:nginx /usr/share/nginx/html    # 递归同时修改所有者和所属组
  ```

### 2.5 `sudo` - 以超级管理员 (root) 身份执行命令
* **常用示例**：
  ```bash
  sudo systemctl restart nginx # 以 root 权限重启服务
  sudo -i                      # 切换到 root 用户的交互式 Shell 环境
  sudo visudo                  # 安全地编辑 /etc/sudoers 提权配置文件
  ```

---

## ⚡ 3. 进程管理 (Process Management)

监控系统 CPU/内存占用，管理正在运行的后台服务与进程。

### 3.1 `ps` - 查看当前静态进程快照
* **常用选项**：
  * `aux`：显示所有终端上的所有用户进程。
  * `-ef`：以全格式显示所有进程信息（包含父进程 PPID）。
* **常用示例**：
  ```bash
  ps aux | grep node       # 查找含有 "node" 关键字的运行进程
  ps -ef | grep python3    # 查看 python3 进程及其 PID/PPID 信息
  ```

### 3.2 `top` / `htop` - 动态实时监控系统资源与进程
* **`top`**（内置原生工具）：
  * 进入后按 `P` 键：按 CPU 使用率排序。
  * 进入后按 `M` 键：按内存使用率排序。
  * 进入后按 `q` 键：退出监控。
* **`htop`**（增强型交互式工具，需额外安装）：
  * 提供彩色图表界面，支持鼠标点击、方向键上下滚动、按 `F3` 搜索、按 `F9` 快速终止进程。
* **常用示例**：
  ```bash
  top
  htop
  ```

### 3.3 `kill` - 终止进程
* **常用信号**：
  * `-15` (SIGTERM)：默认信号，通知进程平滑退出（释放资源后再关闭）。
  * `-9` (SIGKILL)：强制终止信号，立即杀死进程。
* **常用示例**：
  ```bash
  kill 12345        # 优雅终止 PID 为 12345 的进程
  kill -9 12345     # 强制杀死 PID 为 12345 的进程
  killall nginx     # 根据进程名称终止所有 nginx 进程
  pkill -u deployer # 终止指定用户下的所有进程
  ```

### 3.4 `systemctl` - Systemd 服务与系统状态管理
* **常用示例**：
  ```bash
  systemctl start nginx     # 启动服务
  systemctl stop nginx      # 停止服务
  systemctl restart nginx   # 重启服务
  systemctl reload nginx    # 热加载配置文件（不中断服务）
  systemctl status nginx    # 查看服务当前运行状态与日志片段
  systemctl enable nginx    # 设置服务开机自动启动
  systemctl disable nginx   # 取消开机自启
  ```

---

## 🌐 4. 网络配置 (Network Configuration)

检查网络接口卡、测试链路连通性、查看端口监听与防火墙放行规则。

### 4.1 `ip` - 管理网络接口、路由与地址 (替代旧版 `ifconfig`)
* **常用示例**：
  ```bash
  ip a          # (ip addr) 查看所有网卡接口与 IP 地址
  ip route      # 查看系统当前路由表
  ip link set eth0 up/down # 启用/禁用特定网卡接口
  ```

### 4.2 `ping` - 测试网络节点连通性
* **常用选项**：
  * `-c`：指定发送的 ICMP 报文数量。
  * `-i`：指定发送数据包的间隔秒数。
* **常用示例**：
  ```bash
  ping 1.1.1.1        # 持续测试连通性
  ping -c 4 baidu.com # 发送 4 个数据包后自动停止
  ```

### 4.3 `ss` / `netstat` - 查询套接字与网络连接状态 (推荐使用 `ss`)
* **常用选项**：
  * `-t`：仅显示 TCP 连接。
  * `-u`：仅显示 UDP 连接。
  * `-l`：仅显示处于 Listen (监听) 状态的端口。
  * `-n`：直接以数字 IP/端口显示，不解析主机名和服务名。
  * `-p`：显示监听该端口的进程 PID 和程序名称。
* **常用示例**：
  ```bash
  ss -tulnp              # 查看系统所有正在监听的 TCP/UDP 端口及对应 PID
  ss -tulnp | grep :80   # 检查 80 端口被哪个服务占用
  netstat -tulnp         # 传统 netstat 命令（效果相同）
  ```

### 4.4 `firewall-cmd` - RHEL/CentOS 防火墙管理工具
> [!NOTE]
> Debian/Ubuntu 系统通常使用 `ufw` 命令（如 `ufw allow 80/tcp`）。

* **常用示例**：
  ```bash
  firewall-cmd --state                                     # 查看防火墙运行状态
  firewall-cmd --zone=public --add-port=80/tcp --permanent # 永久放行 TCP 80 端口
  firewall-cmd --zone=public --remove-port=80/tcp --permanent # 移除 80 端口放行
  firewall-cmd --reload                                    # 重新加载配置使新规则生效
  firewall-cmd --list-all                                  # 列出当前所有开放的端口与服务
  ```

---

## 🔍 5. 文本处理 (Text Processing)

Linux 拥有非常强大的“三剑客”（`grep`、`sed`、`awk`）及相关文本处理工具。

### 5.1 `grep` - 文本正则匹配与过滤
* **常用选项**：
  * `-i`：忽略字母大小写。
  * `-v`：反向匹配（反选，过滤掉包含关键词的行）。
  * `-n`：在输出结果前显示匹配行的行号。
  * `-r`：递归搜索指定目录下的所有文件。
  * `-E`：开启扩展正则表达式匹配。
  * `-A N`：显示匹配行及**后** N 行内容（After context）。
  * `-B N`：显示匹配行及**前** N 行内容（Before context）。
  * `-C N`：显示匹配行及**前后各** N 行内容（Context）。
* **常用示例**：
  ```bash
  grep "ERROR" /var/log/syslog              # 在文件中查找包含 ERROR 的行
  grep -rn "DB_PASSWORD" /var/www/project   # 在项目目录中递归检索变量定义及行号
  grep -v "^#" config.conf                  # 过滤掉配置文件中的注释行（以 # 开头）
  grep -A 5 "Exception" app.log             # 查找到 Exception 并且打印其后 5 行（便于排查异常堆栈）
  ```

### 5.2 `awk` - 文本列提取与模式处理
* **常用示例**：
  ```bash
  awk '{print $1}' access.log               # 打印文本每行的第一列（默认以空格/Tab切分）
  awk -F ':' '{print $1, $6}' /etc/passwd   # 指定冒号 ':' 为分隔符，打印第 1 列和第 6 列
  awk '$3 > 100 {print $0}' data.txt        # 仅输出第 3 列数值大于 100 的完整行
  ```

### 5.3 `sed` - 流编辑器与批量文本替换
* **常用选项**：
  * `-i`：直接修改文件内容（原地编辑，不加 `-i` 仅向标准输出打印）。
* **常用示例**：
  ```bash
  sed 's/http/https/g' config.txt          # 将每行所有的 http 替换为 https 并输出
  sed -i 's/127.0.0.1/0.0.0.0/g' app.conf   # 直接修改配置文件，替换监听地址
  sed -i '5d' data.txt                     # 删除文件中的第 5 行
  ```

### 5.4 `cut` - 按列或字符位置裁切文本
* **常用示例**：
  ```bash
  cut -d ':' -f 1 /etc/passwd   # 以 ':' 为分隔符，提取第一列用户名
  cut -c 1-10 file.txt          # 截取每行的前 10 个字符
  ```

### 5.5 `sort` - 对文本行进行排序
* **常用选项**：
  * `-n`：按数值大小进行排序（默认是按字典顺序）。
  * `-r`：降序/反向排序。
  * `-k`：指定按第几列作为排序依据。
* **常用示例**：
  ```bash
  sort numbers.txt            # 按字典顺序升序排列
  sort -n -r numbers.txt      # 按数字大小从大到小降序排列
  ```

### 5.6 `uniq` - 报告或忽略连续的重复行
> [!TIP]
> `uniq` 只能去除**连续相邻**的重复行，因此通常必须先与 `sort` 结合使用。

* **常用选项**：
  * `-c`：在每行开头显示该行重复出现的次数。
  * `-d`：仅显示发生重复的行。
* **常用示例**：
  ```bash
  sort access.log | uniq -c | sort -nr | head -n 10 # 统计访问日志中出现频次最高的 Top 10 IP
  ```

### 5.7 `wc` - 统计文件的行数、单词数与字节数
* **常用选项**：
  * `-l`：统计行数（Lines）。
  * `-w`：统计单词数（Words）。
  * `-c`：统计字节数（Bytes）。
  * `-m`：统计字符数（Characters）。
* **常用示例**：
  ```bash
  wc -l access.log               # 统计日志文件的总行数
  cat file.txt | wc -l           # 配合管道统计输出结果的总行数
  ps aux | grep nginx | wc -l    # 统计进程过滤结果的行数
  wc -l -w -c message.txt        # 同时统计文件的行数、单词数和字节数
  ```

---

## 📊 6. 系统查看 (System Information)

快速了解当前运行环境、主机标识、内核版本以及硬件资源消耗。

### 6.1 `pwd` - 显示当前工作目录的绝对路径
* **常用示例**：
  ```bash
  pwd  # 输出如：/home/deployer/project
  ```

### 6.2 `hostname` - 查看或设置当前系统的主机名
* **常用示例**：
  ```bash
  hostnamectl status                       # 查看详细的主机与系统识别信息
  sudo hostnamectl set-hostname server-01  # 永久修改系统主机名为 server-01
  ```

### 6.3 `uname -r` - 查看 Linux 内核版本
* **常用示例**：
  ```bash
  uname -r  # 输出当前运行的内核版本（如：5.15.0-88-generic）
  uname -a  # 查看完整系统架构（内核版本、主机名、硬件架构 x86_64/aarch64 等）
  ```

### 6.4 `free -h` - 查看内存 (RAM) 与交换分区 (Swap) 使用情况
* **常用选项**：
  * `-h`：自动转换为人类易读格式（MB、GB）。
* **常用示例**：
  ```bash
  free -h   # 输出总量 (total)、已用 (used)、空闲 (free) 和缓冲/缓存 (buff/cache)
  ```

### 6.5 `df -h` - 查看磁盘挂载点空间利用率
* **常用选项**：
  * `-h`：以人类易读单位显示。
  * `-i`：查看 inode 的使用率（当磁盘空间充足但无法创建文件时排查是否 inode 耗尽）。
* **常用示例**：
  ```bash
  df -h   # 查看根分区及各个挂载点的容量与剩余空间
  df -ih  # 查看 inode 节点占用情况
  ```

### 6.6 `du` - 查看文件及目录占用的磁盘空间
* **常用选项**：
  * `-h`：以人类易读格式显示（K、M、G）。
  * `-s`：仅显示总计大小（summary），不展开显示各子目录。
  * `-a`：显示所有文件和目录的大小。
  * `--max-depth=N`：指定统计目录的最大深度层级。
* **常用示例**：
  ```bash
  du -sh *                          # 查看当前目录下各个文件及目录的总体积
  du -h --max-depth=1 /var/log      # 查看 /var/log 下第一级子目录各自占用的空间
  du -ah /path | sort -hr | head -n 10  # 排查并列出占用空间最大的前 10 个文件或目录
  ```

### 6.7 `date` - 显示或设置系统时间与格式化日期
* **常用选项**：
  * `+%Y-%m-%d %H:%M:%S`：按指定格式格式化输出日期时间（`%Y` 年、`%m` 月、`%d` 日、`%H` 时、`%M` 分、`%S` 秒）。
  * `-d` / `--date`：显示由字符串描述的时间（如 `"yesterday"`、`"+1 day"`、`"2026-08-25"`）。
  * `-u` / `--utc`：显示或设置协调世界时（UTC）。
  * `-s` / `--set`：手动修改系统时间与日期（需要 root 权限）。
* **常用示例**：
  ```bash
  date                              # 查看当前系统本地时间与时区
  date "+%Y-%m-%d %H:%M:%S"         # 格式化输出当前时间（例：2026-08-25 16:58:35）
  date -u                           # 查看 UTC 世界协调时间
  date -d "yesterday" "+%Y-%m-%d"   # 获取昨天的日期
  date -d "+7 days" "+%Y-%m-%d"     # 获取 7 天后的日期
  sudo date -s "2026-08-25 12:00:00"# 手动修改系统时间（需 root 权限）
  ```

---

## 📜 7. 日志查看 (Log Viewing)

排查服务崩溃、请求异常与系统报错的核心技巧。

### 7.1 `journalctl` - Systemd 全局日志查询管理
* **常用选项**：
  * `-u`：指定服务名称（如 `nginx`、`docker`）。
  * `-f`：实时追踪日志（类似于 `tail -f`）。
  * `-n`：显示最后 N 行日志。
  * `--since`：按起始时间筛选日志。
  * `-p err`：按错误级别过滤（`err`, `warning`, `info` 等）。
* **常用示例**：
  ```bash
  journalctl -u nginx -f                       # 动态实时查看 nginx 服务日志
  journalctl -u docker -n 100 --no-pager       # 查看最近 100 条 docker 服务日志
  journalctl --since "2026-08-24 08:00:00"     # 查询指定时间点之后产生的系统日志
  ```

### 7.2 `tail -f` - 实时追踪文件末尾输出
* **常用选项**：
  * `-n`：指定先打印倒数多少行。
* **常用示例**：
  ```bash
  tail -f /var/log/syslog                     # 实时监测系统日志变化
  tail -100f /var/log/nginx/error.log         # 输出最新 100 行并持续追踪 Nginx 错误日志
  ```

### 7.3 `/var/log` 核心系统日志目录解析
Linux 系统大多数核心服务的日志都集中放置在 `/var/log` 目录下：

* `/var/log/messages` 或 `/var/log/syslog`：系统通用综合日志（包含内核与大多数系统服务记录）。
* `/var/log/auth.log` 或 `/var/log/secure`：用户身份认证与登录日志（如 SSH 登录成功/失败记录）。
* `/var/log/dmesg`：内核引导与系统启动过程中的硬件设备检测日志。
* `/var/log/nginx/` 或 `/var/log/httpd/`：Web 服务器的访问日志 (`access.log`) 与错误日志 (`error.log`)。
* `/var/log/dpkg.log` 或 `/var/log/yum.log`：包管理器进行软件安装、更新或卸载的记录。

---

## 📦 8. 包管理 (Package Management)

根据不同 Linux 发行版族群，使用对应的包管理工具进行软件维护。

### 8.1 CentOS / RHEL / Fedora 族群 (`yum` / `dnf`)
CentOS 7 主流使用 `yum`，CentOS 8 / RHEL 8+ / Fedora 推荐使用下一代包管理器 `dnf`（参数用法基本一致）。

* **常用示例**：
  ```bash
  yum update / dnf upgrade              # 更新软件源与已安装的所有软件包
  yum install -y nginx / dnf install -y nginx  # 安装指定软件（-y 表示自动确认）
  yum remove nginx / dnf remove nginx    # 卸载软件包
  yum search htop / dnf search htop      # 搜索可用软件包
  yum clean all / dnf clean all          # 清理本地缓存
  ```

### 8.2 Debian / Ubuntu 族群 (`apt`)
Debian 及 Ubuntu 系统使用 `apt`（高级包装工具）进行软件包生命周期管理。

* **常用示例**：
  ```bash
  sudo apt update               # 更新本地软件源索引列表
  sudo apt upgrade -y           # 升级所有可更新的软件包
  sudo apt install -y curl git  # 安装指定软件包
  sudo apt remove nginx         # 移除软件包（保留配置文件）
  sudo apt purge nginx          # 彻底清除软件包及其配置文件
  sudo apt autoremove -y        # 自动清理不再被依赖的孤立软件包
  sudo apt search redis         # 在软件源中搜索包含 redis 关键字的包
  ```

---

> [!TIP]
> 建议在终端中使用 `man <command>` 或命令后跟 `--help`（例如 `find --help`）来阅读最权威的官方本地帮助文档！
