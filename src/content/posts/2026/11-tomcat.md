---
title: Linux 环境下 Tomcat 安装部署全指南：指定版本安装、Docker 容器化对比与高频避坑实战
published: 2026-05-13T00:00:00
description: 本文详细介绍了 Apache Tomcat 在 Linux 环境下的安装与部署方案，涵盖 JDK 依赖与指定版本选择（Tomcat 8.5/9/10/11及javax到jakarta迁移）、Docker容器化部署与传统部署的优劣对比，并深入剖析内存溢出、端口占用、字符编码、开机自启等新手高频避坑要点。
tags:
  - Linux
  - 运维
  - Java
  - Tomcat
  - Docker
category: Linux运维
image: https://img.072199.xyz/file/blog/1788016404357.png
pinned: false
---
## 📌 什么是 Tomcat？

**Apache Tomcat** 是由 Apache 软件基金会（ASF）开发维护的开源 **Java Servlet 容器与 Web 服务器**。作为 Java EE / Jakarta EE 规范的核心实现之一，Tomcat 完整支持 Servlet、JSP（JavaServer Pages）、EL 表达式以及 WebSocket 技术。

凭借其**轻量、高效、稳定、高度可定制以及完全开源免费**的特性，Tomcat 长期作为中小型 Java Web 应用、企业级系统与 Spring Boot 内嵌 Web 容器的首选运行环境。

---

## 🛠️ 一、Linux 系统中安装指定版本 Tomcat

Tomcat 属于纯 Java 应用，其运行**严格依赖 JDK 环境**。在部署前，务必先确定目标 Tomcat 版本与 JDK 版本的兼容矩阵：

| Tomcat 版本 | 支持的 Servlet 规范 | 命名空间 | 推荐最低 JDK 版本 |
| :--- | :--- | :--- | :--- |
| **Tomcat 8.5.x** | Servlet 3.1 | `javax.servlet` | JDK 7 / 8 |
| **Tomcat 9.0.x** | Servlet 4.0 | `javax.servlet` | JDK 8+ |
| **Tomcat 10.1.x** | Servlet 6.0 | `jakarta.servlet` | JDK 11+ (推荐 JDK 17/21) |
| **Tomcat 11.0.x** | Servlet 6.1 | `jakarta.servlet` | JDK 17+ (推荐 JDK 21) |

> [!IMPORTANT]
> **关键差异提示**：Tomcat 10+ 开始全面迁移至 **Jakarta EE** 规范，包名从 `javax.*` 变更为 `jakarta.*`。旧版 Spring MVC / Java Web 项目如果直接部署在 Tomcat 10+ 上会抛出 `ClassNotFoundException: javax.servlet.*`。

---

### 方法 1：安装前置 JDK 环境

无论使用哪种 Tomcat 部署方式，宿主机均需安装对应版本的 JDK（以 OpenJDK 17 为例）：

```bash title="Ubuntu / Debian 终端"
# 安装 OpenJDK 17
sudo apt update
sudo apt install -y openjdk-17-jdk

# 验证安装
java -version
```

```bash title="CentOS / RHEL 终端"
# 安装 OpenJDK 17
sudo yum install -y java-17-openjdk-devel

# 验证安装
java -version
```

---

### 方法 2：通用二进制压缩包安装指定版本（推荐）

通过 Apache 官方归档源下载精确小版本（以 **Tomcat 9.0.86** 和 **Tomcat 10.1.19** 为例）。

#### 1. 下载与解压
```bash title="系统终端"
# 创建安装目录
sudo mkdir -p /opt/tomcat

# 下载指定版本的 Tomcat 二进制包（以 9.0.86 为例）
wget https://archive.apache.org/dist/tomcat/tomcat-9/v9.0.86/bin/apache-tomcat-9.0.86.tar.gz

# 解压并重命名
sudo tar -zxvf apache-tomcat-9.0.86.tar.gz -C /opt/tomcat/
sudo mv /opt/tomcat/apache-tomcat-9.0.86 /opt/tomcat/tomcat9
```

#### 2. 创建专用运行用户与目录提权
```bash title="系统终端"
# 创建不可登录的 tomcat 系统用户与组
sudo groupadd tomcat
sudo useradd -s /bin/false -g tomcat -d /opt/tomcat/tomcat9 tomcat

# 赋予目录归属与脚本执行权限
sudo chown -R tomcat:tomcat /opt/tomcat/tomcat9
sudo chmod +x /opt/tomcat/tomcat9/bin/*.sh
```

#### 3. 配置 Systemd 系统守护进程服务
创建系统服务文件 `/etc/systemd/system/tomcat.service`：
```ini title="/etc/systemd/system/tomcat.service"
[Unit]
Description=Apache Tomcat Web Application Container
After=network.target

[Service]
Type=forking

User=tomcat
Group=tomcat

# 根据实际 JDK 路径配置（可用 update-alternatives --config java 查询）
Environment="JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
Environment="CATALINA_PID=/opt/tomcat/tomcat9/temp/tomcat.pid"
Environment="CATALINA_HOME=/opt/tomcat/tomcat9"
Environment="CATALINA_BASE=/opt/tomcat/tomcat9"
Environment="CATALINA_OPTS=-Xms512M -Xmx1024M -server -XX:+UseG1GC"
Environment="JAVA_OPTS=-Djava.awt.headless=true -Dfile.encoding=UTF-8"

ExecStart=/opt/tomcat/tomcat9/bin/startup.sh
ExecStop=/opt/tomcat/tomcat9/bin/shutdown.sh

RestartSec=10
Restart=always

[Install]
WantedBy=multi-user.target
```

#### 4. 重新加载并管理服务
```bash title="系统终端"
# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 启动 Tomcat 并设置开机自启
sudo systemctl start tomcat
sudo systemctl enable tomcat

# 查看服务运行状态
sudo systemctl status tomcat
```

---

## 🐳 二、Linux 下使用 Docker 快速部署 Tomcat

使用 Docker 可以在同一台机器上秒级运行任意特定版本（如 Tomcat 8.5、9.0、10.1），彻底免去宿主机配置多版本 JDK 的繁琐流程。

### 1. `docker run` 单行命令运行
```bash title="Docker 终端"
docker run -d \
  --name tomcat-server \
  -p 8080:8080 \
  -v /opt/tomcat_docker/webapps:/usr/local/tomcat/webapps \
  -v /opt/tomcat_docker/logs:/usr/local/tomcat/logs \
  -v /opt/tomcat_docker/conf:/usr/local/tomcat/conf \
  -e TZ=Asia/Shanghai \
  -e JAVA_OPTS="-Xms512m -Xmx1024m -Dfile.encoding=UTF-8" \
  --restart unless-stopped \
  tomcat:9.0-jdk17-corretto
```

### 2. `docker-compose.yml` 规范化编排
在部署目录下创建 `docker-compose.yml`：
```yaml title="docker-compose.yml"
version: '3.8'

services:
  tomcat:
    image: tomcat:9.0-jdk17-corretto
    container_name: tomcat-app
    restart: always
    environment:
      TZ: Asia/Shanghai
      JAVA_OPTS: "-Xms1024m -Xmx2048m -XX:+UseG1GC -Dfile.encoding=UTF-8"
    ports:
      - "8080:8080"
    volumes:
      - ./webapps:/usr/local/tomcat/webapps
      - ./conf/server.xml:/usr/local/tomcat/conf/server.xml
      - ./logs:/usr/local/tomcat/logs
```

管理命令：
```bash title="Docker Compose 终端"
# 启动
docker compose up -d

# 查看实时日志
docker compose logs -f
```

---

## ⚖️ 三、Docker 部署 vs 传统宿主机部署优劣对比

| 评估维度 | Docker 容器化部署 | 传统宿主机/裸机部署 (Systemd 托管) |
| :--- | :--- | :--- |
| **JDK 版本隔离** | 🌟 **完全解耦**，镜像内置对应 JDK，无需在宿主机配置复杂环境变量 | ⚠️ 宿主机若运行多个不同 JDK 版本的 Java 项目易发生 `JAVA_HOME` 污染 |
| **启动与交付效率** | ⚡ **秒级交付**，将 WAR 包直接打包入镜像或挂载即可跨环境无缝运行 | ⏳ **需配置前置环境**，需手动安装 JDK、配置目录权限和 Systemd 脚本 |
| **多实例与端口映射** | 🌟 **极其简单**，容器内均使用 8080 端口，宿主机只需映射不同端口 | ⚠️ 需复制多份 Tomcat 目录，修改各自 `server.xml` 中的 3 个端口（8005/8080/8009） |
| **JVM 性能与资源上限** | 损耗微乎其微（< 1%），支持 `cgroups` 精确限制 CPU 与内存上限 | 🚀 **原生运行**，可直接利用宿主机所有硬件特性与线程调度 |
| **日志与排查便捷度** | 可通过 `docker logs` 统一采集，配合 ELK 或 Promtail 更轻松 | 🛠️ 直接在 `/opt/tomcat/logs/` 查阅 `catalina.out`，原生 GDB / jstack 排查更直接 |

> [!NOTE]
> **选型决策参考**：
> * **微服务交付、CI/CD 自动化流水线、测试环境**：首选 **Docker**，实现构建产物与运行时一体化分发。
> * **单体遗留架构、需复杂本地 JNI 库依赖或需要本地频繁 JStack/JMap 诊断的超大内存服务**：可采用 **宿主机 Systemd 部署**。

---

## ⚠️ 四、新手最容易犯错的关键坑点与解决方案

---

### 💣 坑点 1：Docker 官方 Tomcat 镜像启动后访问报 404 错误

#### 现象
使用 Docker 运行 `tomcat:latest` 或 `tomcat:9` 后，浏览器打开 `http://IP:8080` 提示 `HTTP Status 404 – Not Found`。

#### 核心原因
Docker 官方为了精简镜像体积，在较新版本镜像中将原本的默认示例页面目录重命名为 `webapps.dist`，而新建的 `webapps` 目录为空。

#### 解决方案
进入容器将 `webapps.dist` 里的内容拷贝回 `webapps`：
```bash title="Docker 终端"
# 进入容器
docker exec -it tomcat-server bash

# 将预置文件复制到 webapps 目录
cp -r /usr/local/tomcat/webapps.dist/* /usr/local/tomcat/webapps/
```

---

### 💣 坑点 2：Tomcat 10+ 部署旧项目报错 ClassNotFoundException: javax.servlet.*

#### 现象
将旧项目的 WAR 包部署到 Tomcat 10.x 或 11.x 后启动崩溃，报类找不到错误：`java.lang.ClassNotFoundException: javax.servlet.Filter`。

#### 核心原因
Tomcat 10+ 全面切换至 **Jakarta EE 9+** 体系，包名全面变更为 `jakarta.servlet.*`，与 Java EE 8 之前的 `javax.servlet.*` 不兼容。

#### 解决方案
1. **方案 A（推荐）**：降级使用 **Tomcat 9.0.x**（继续支持 `javax.servlet`）。
2. **方案 B**：使用 Apache 官方提供的迁移工具 **Tomcat Migration Tool for Jakarta EE** 进行字节码自动转换：
   ```bash title="系统终端"
   java -jar jakartaee-migration-*.jar old_app.war new_app.war
   ```

---

### 💣 坑点 3：日志与控制台中文输出乱码（??? 或 涓枃）

#### 现象
在 `catalina.out` 或控制台日志中，中文字符显示为乱码或问号。

#### 核心原因
Linux 系统的 `LANG` 编码、Tomcat 自身的 `file.encoding` 以及 `server.xml` 中的 URI 编码未对齐。

#### 解决方案
1. **修改 `bin/catalina.sh` 添加 UTF-8 参数**：
   ```bash title="bin/catalina.sh"
   JAVA_OPTS="$JAVA_OPTS -Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"
   ```
2. **修改 `conf/server.xml` 中的 Connector 节点**，显式声明 `URIEncoding="UTF-8"`：
   ```xml title="conf/server.xml"
   <Connector port="8080" protocol="HTTP/1.1"
              connectionTimeout="20000"
              redirectPort="8443"
              URIEncoding="UTF-8" />
   ```

---

### 💣 坑点 4：服务关闭时报 java.lang.OutOfMemoryError 且进程残留（内存泄露）

#### 现象
执行 `shutdown.sh` 后，日志抛出 `The web application [xxx] appears to have started a thread named [xxx] but has failed to stop it. This is very likely to create a memory leak.`，且 `ps -ef | grep tomcat` 发现进程根本没有退出。

#### 核心原因
Web 应用中存在未正确注销的线程（如 `Timer`、线程池、JDBC 驱动守护线程），导致 JVM 拒绝正常终止。

#### 解决方案
1. **在 Systemd 服务或脚本中增加强制停止参数**：
   在 `catalina.sh` 中配置 `CATALINA_PID`，并在停止时调用 `-force`：
   ```bash title="bin/catalina.sh"
   CATALINA_PID=/opt/tomcat/tomcat9/temp/tomcat.pid
   ```
   停止命令改为：
   ```bash title="系统终端"
   /opt/tomcat/tomcat9/bin/shutdown.sh 5 -force
   ```

---

### 💣 坑点 5：Tomcat 启动极慢（卡在 At least one JAR was scanned...）

#### 现象
Tomcat 启动耗时多达数分钟，日志停滞在：`Creation of SecureRandom instance for session ID generation using [SHA1PRNG] took [xxx] milliseconds.`。

#### 核心原因
Linux 的 `/dev/random` 在熵池不足时会阻塞，导致生成 Session ID 的安全随机数生成器挂起。

#### 解决方案
在 `catalina.sh` 的 `JAVA_OPTS` 中将阻塞的 `/dev/random` 替换为非阻塞的 `/dev/urandom`：
```bash title="bin/catalina.sh"
JAVA_OPTS="$JAVA_OPTS -Djava.security.egd=file:/dev/./urandom"
```

---

## 📋 五、生产环境通用优化配置模板（`server.xml`）

一份优化过连接器并发、禁用 AJP 漏洞端口并隐藏敏感版本的生产配置：

```xml title="conf/server.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Server port="8005" shutdown="SHUTDOWN_SECRET_TOKEN">
  <Listener className="org.apache.catalina.startup.VersionLoggerListener" />
  <Listener className="org.apache.catalina.core.AprLifecycleListener" SSLEngine="on" />
  <Listener className="org.apache.catalina.core.JreMemoryLeakPreventionListener" />
  <Listener className="org.apache.catalina.mbeans.GlobalResourcesLifecycleListener" />
  <Listener className="org.apache.catalina.core.ThreadLocalLeakPreventionListener" />

  <Service name="Catalina">
    <!-- 高性能 NIO 连接器配置 -->
    <Connector port="8080" 
               protocol="org.apache.coyote.http11.Http11NioProtocol"
               connectionTimeout="20000"
               redirectPort="8443"
               maxThreads="500"
               minSpareThreads="50"
               acceptCount="200"
               maxConnections="10000"
               enableLookups="false"
               URIEncoding="UTF-8"
               server="Web Server"
               compression="on"
               compressionMinSize="2048"
               compressableMimeType="text/html,text/xml,text/plain,text/css,text/javascript,application/javascript,application/json" />

    <!-- 生产环境若不使用 Apache 反代，务必注释掉默认开放的 8009 AJP 端口以避免 Ghostcat 漏洞 -->
    <!-- <Connector protocol="AJP/1.3" port="8009" redirectPort="8443" /> -->

    <Engine name="Catalina" defaultHost="localhost">
      <Host name="localhost" appBase="webapps" unpackWARs="true" autoDeploy="false">
        <!-- 访问日志配置 -->
        <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
               prefix="localhost_access_log" suffix=".txt"
               pattern="%h %l %u %t &quot;%r&quot; %s %b %D" />
      </Host>
    </Engine>
  </Service>
</Server>
```

---

## 🎯 总结速查

1. **版本匹配**：
   - 传统 Java EE 8 / `javax.*` 项目首选 **Tomcat 9.0.x**。
   - 新一代 Jakarta EE 10+ / Spring Boot 3+ 项目采用 **Tomcat 10.1.x / 11.0.x**。
2. **生产上线避坑清单**：
   - [ ] 确认 JDK 版本与 Tomcat 版本矩阵匹配；
   - [ ] 在 `JAVA_OPTS` 中配置 `-Dfile.encoding=UTF-8` 与 `-Djava.security.egd=file:/dev/./urandom`；
   - [ ] 针对物理内存配置合理 JVM 堆大小（`-Xms`、`-Xmx`）并启用 G1 垃圾收集器；
   - [ ] 注释未使用的 8009 AJP 端口，防范网络安全风险；
   - [ ] 生产环境建议关闭 `autoDeploy="false"`，避免运行时频繁热扫描消耗 CPU。
