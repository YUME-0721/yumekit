<script lang="ts">
    import { onMount, tick } from "svelte";

    interface CommandOutput {
        id: string;
        command: string;
        type: "system" | "user" | "matrix" | "html";
        content?: string;
        htmlContent?: string;
        timestamp: string;
    }

    let inputCommand = "";
    let history: string[] = [];
    let historyIndex = -1;
    let outputs: CommandOutput[] = [];
    let isMatrixMode = false;
    let isExpanded = false;
    let isMinimized = false;
    let terminalBodyEl: HTMLDivElement | null = null;
    let inputEl: HTMLInputElement | null = null;
    let matrixCanvasEl: HTMLCanvasElement | null = null;
    let matrixInterval: any = null;

    const availableCommands = [
        "help",
        "neofetch",
        "skills",
        "posts",
        "whoami",
        "weather",
        "matrix",
        "music",
        "theme",
        "sudo rm -rf /*",
        "history",
        "clear"
    ];

    const quickCommands = [
        { label: "neofetch", cmd: "neofetch" },
        { label: "skills", cmd: "skills" },
        { label: "posts", cmd: "posts" },
        { label: "matrix", cmd: "matrix" },
        { label: "sudo rm -rf /*", cmd: "sudo rm -rf /*" },
        { label: "help", cmd: "help" },
        { label: "clear", cmd: "clear" }
    ];

    function getNowTime(): string {
        const d = new Date();
        return d.toTimeString().split(" ")[0];
    }

    function scrollToBottom() {
        tick().then(() => {
            if (terminalBodyEl) {
                terminalBodyEl.scrollTop = terminalBodyEl.scrollHeight;
            }
        });
    }

    function focusInput() {
        if (inputEl && !isMatrixMode) {
            inputEl.focus();
        }
    }

    // 启动 Matrix 代码雨
    function startMatrixEffect() {
        isMatrixMode = true;
        tick().then(() => {
            if (!matrixCanvasEl) return;
            const canvas = matrixCanvasEl;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            canvas.width = canvas.parentElement?.clientWidth || 600;
            canvas.height = canvas.parentElement?.clientHeight || 240;

            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";
            const fontSize = 14;
            const columns = Math.floor(canvas.width / fontSize);
            const drops: number[] = [];

            for (let i = 0; i < columns; i++) {
                drops[i] = Math.floor(Math.random() * -50);
            }

            if (matrixInterval) clearInterval(matrixInterval);
            matrixInterval = setInterval(() => {
                ctx.fillStyle = "rgba(10, 10, 15, 0.1)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = "#FF79C6"; // 主题粉色流光
                ctx.font = `${fontSize}px monospace`;

                for (let i = 0; i < drops.length; i++) {
                    const text = chars.charAt(Math.floor(Math.random() * chars.length));
                    const x = i * fontSize;
                    const y = drops[i] * fontSize;

                    // 龙头高亮白，龙身流光粉绿
                    if (Math.random() > 0.85) {
                        ctx.fillStyle = "#50FA7B";
                    } else if (Math.random() > 0.5) {
                        ctx.fillStyle = "#FFF";
                    } else {
                        ctx.fillStyle = "#FF79C6";
                    }

                    ctx.fillText(text, x, y);

                    if (y > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
            }, 33);
        });
    }

    function stopMatrixEffect() {
        if (matrixInterval) {
            clearInterval(matrixInterval);
            matrixInterval = null;
        }
        isMatrixMode = false;
        focusInput();
    }

    // 指令解析与执行
    function executeCommand(rawCmd: string) {
        const cmd = rawCmd.trim();
        if (!cmd) return;

        // 记录历史
        history = [...history, cmd];
        historyIndex = history.length;

        const lower = cmd.toLowerCase();
        const parts = cmd.split(" ");
        const action = parts[0].toLowerCase();
        const arg = parts.slice(1).join(" ").trim();

        let outputHtml = "";

        if (lower === "clear" || lower === "cls") {
            outputs = [];
            inputCommand = "";
            return;
        }

        if (lower === "matrix") {
            startMatrixEffect();
            outputs = [
                ...outputs,
                {
                    id: Math.random().toString(),
                    command: cmd,
                    type: "matrix",
                    timestamp: getNowTime()
                }
            ];
            inputCommand = "";
            scrollToBottom();
            return;
        }

        switch (action) {
            case "help":
            case "?":
                outputHtml = `
<div class="text-sm space-y-1.5 leading-relaxed text-neutral-300 font-mono">
    <div class="text-[var(--primary)] font-bold mb-1">⚡ 放课后の技术部 · 极客终端指令手册:</div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div><span class="text-cyan-400 font-bold">neofetch</span> <span class="text-neutral-500">─</span> <span class="text-neutral-400">查看系统规格与硬件画像</span></div>
        <div><span class="text-cyan-400 font-bold">skills</span> <span class="text-neutral-500">─</span> <span class="text-neutral-400">展示全栈技能树与熟练度</span></div>
        <div><span class="text-cyan-400 font-bold">posts</span> <span class="text-neutral-500">─</span> <span class="text-neutral-400">列出最新发布的精选文章</span></div>
        <div><span class="text-cyan-400 font-bold">whoami</span> <span class="text-neutral-500">─</span> <span class="text-neutral-400">打印博主档案与座右铭</span></div>
        <div><span class="text-cyan-400 font-bold">matrix</span> <span class="text-neutral-500">─</span> <span class="text-neutral-400">开启全屏黑客帝国流光代码雨</span></div>
        <div><span class="text-cyan-400 font-bold">weather</span> <span class="text-neutral-500">─</span> <span class="text-neutral-400">获取极客专属天气预报</span></div>
        <div><span class="text-cyan-400 font-bold">music [cmd]</span> <span class="text-neutral-500">─</span> <span class="text-neutral-400">控制音乐 (play/pause/next)</span></div>
        <div><span class="text-cyan-400 font-bold">theme [mode]</span> <span class="text-neutral-500">─</span> <span class="text-neutral-400">切换主题 (dark/light)</span></div>
        <div><span class="text-pink-400 font-bold">sudo rm -rf /*</span> <span class="text-neutral-500">─</span> <span class="text-neutral-400">触发紧急防御系统彩蛋</span></div>
        <div><span class="text-cyan-400 font-bold">clear</span> <span class="text-neutral-500">─</span> <span class="text-neutral-400">清空终端屏幕输出</span></div>
    </div>
    <div class="text-neutral-500 text-[11px] mt-2 pt-1 border-t border-white/5">💡 提示: 按 <kbd class="px-1 py-0.5 rounded bg-white/10 text-neutral-300">Tab</kbd> 可自动补全，按 <kbd class="px-1 py-0.5 rounded bg-white/10 text-neutral-300">↑</kbd> <kbd class="px-1 py-0.5 rounded bg-white/10 text-neutral-300">↓</kbd> 翻阅历史指令。</div>
</div>`;
                break;

            case "neofetch":
            case "system":
                outputHtml = `
<div class="flex flex-col md:flex-row gap-4 font-mono text-xs leading-snug py-1">
    <div class="text-[var(--primary)] select-none font-bold text-[11px] leading-tight shrink-0 hidden sm:block">
      /\\_/\\  
     ( o.o )  YuNeOS v2.6
      > ^ <   放课后の技术部
     /|   |\\  
    (_|___|_) 
    </div>
    <div class="space-y-1 text-neutral-300">
        <div><span class="text-[var(--primary)] font-bold">yume</span><span class="text-neutral-500">@</span><span class="text-cyan-400 font-bold">afterschool-dept</span></div>
        <div class="text-neutral-600 dark:text-neutral-500">--------------------------------</div>
        <div><span class="text-pink-400 font-semibold">OS:</span> YuNeOS Linux x86_64 (Fuwari Core v5.7.9)</div>
        <div><span class="text-pink-400 font-semibold">Host:</span> 放课后の技术部 (https://yumekai.top)</div>
        <div><span class="text-pink-400 font-semibold">Kernel:</span> 6.12.0-cloud-native-edge</div>
        <div><span class="text-pink-400 font-semibold">Uptime:</span> 365 days, 7 hours, 21 mins (SLA: 99.99%)</div>
        <div><span class="text-pink-400 font-semibold">Shell:</span> zsh 5.9 (x86_64-debian-linux-gnu)</div>
        <div><span class="text-pink-400 font-semibold">Stack:</span> Astro 5.7 · Svelte 5 · TailwindCSS · Docker</div>
        <div><span class="text-pink-400 font-semibold">Terminal:</span> YuNe Web Terminal (xterm-256color)</div>
        <div class="flex items-center gap-1 mt-2 pt-1">
            <span class="w-3 h-3 rounded-sm bg-neutral-900 inline-block"></span>
            <span class="w-3 h-3 rounded-sm bg-red-500 inline-block"></span>
            <span class="w-3 h-3 rounded-sm bg-green-500 inline-block"></span>
            <span class="w-3 h-3 rounded-sm bg-yellow-500 inline-block"></span>
            <span class="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>
            <span class="w-3 h-3 rounded-sm bg-purple-500 inline-block"></span>
            <span class="w-3 h-3 rounded-sm bg-cyan-500 inline-block"></span>
            <span class="w-3 h-3 rounded-sm bg-pink-500 inline-block"></span>
            <span class="w-3 h-3 rounded-sm bg-white inline-block"></span>
        </div>
    </div>
</div>`;
                break;

            case "skills":
            case "tech":
                outputHtml = `
<div class="font-mono text-xs space-y-1 text-neutral-300 py-1">
    <div class="text-[var(--primary)] font-bold mb-1">🚀 全栈核心能力矩阵 (Skill Matrix):</div>
    <div class="space-y-1">
        <div><span class="text-cyan-400 font-bold inline-block w-24">Docker / K8s</span> <span class="text-emerald-400">[██████████]</span> <span class="text-neutral-400">96%</span> <span class="text-neutral-500 text-[11px]">容器编排 · 持续集成</span></div>
        <div><span class="text-yellow-400 font-bold inline-block w-24">Linux Ops</span> <span class="text-emerald-400">[█████████░]</span> <span class="text-neutral-400">92%</span> <span class="text-neutral-500 text-[11px]">内核调优 · 网络穿透</span></div>
        <div><span class="text-purple-400 font-bold inline-block w-24">Astro / Svelte</span> <span class="text-emerald-400">[██████████]</span> <span class="text-neutral-400">95%</span> <span class="text-neutral-500 text-[11px]">极速前端 · 现代架构</span></div>
        <div><span class="text-blue-400 font-bold inline-block w-24">TypeScript</span> <span class="text-emerald-400">[█████████░]</span> <span class="text-neutral-400">90%</span> <span class="text-neutral-500 text-[11px]">严格类型 · 工程规范</span></div>
        <div><span class="text-emerald-400 font-bold inline-block w-24">Node / Python</span> <span class="text-emerald-400">[████████░░]</span> <span class="text-neutral-400">86%</span> <span class="text-neutral-500 text-[11px]">后端服务 · 自动化脚本</span></div>
        <div><span class="text-pink-400 font-bold inline-block w-24">QA & Testing</span> <span class="text-emerald-400">[█████████░]</span> <span class="text-neutral-400">94%</span> <span class="text-neutral-500 text-[11px]">用例设计 · 自动化测试</span></div>
    </div>
</div>`;
                break;

            case "posts":
            case "ls":
                outputHtml = `
<div class="font-mono text-xs space-y-1 text-neutral-300 py-1">
    <div class="text-[var(--primary)] font-bold mb-1">📚 最新发布文章索引 (Latest Posts):</div>
    <div class="space-y-1">
        <div><span class="text-neutral-500">[1]</span> <a href="/posts/2026/08-resource-station/" class="text-cyan-400 hover:text-pink-400 underline transition-colors">✨ 我的资源导航站：常用工具与优质资源聚合</a> <span class="text-neutral-500 text-[10px]">2026-08</span></div>
        <div><span class="text-neutral-500">[2]</span> <a href="/posts/2026/07-blog/" class="text-cyan-400 hover:text-pink-400 underline transition-colors">🚀 从零构建现代化博客：Fuwari 深度定制记</a> <span class="text-neutral-500 text-[10px]">2026-08</span></div>
        <div><span class="text-neutral-500">[3]</span> <a href="/posts/2026/09-linux/" class="text-cyan-400 hover:text-pink-400 underline transition-colors">🐧 Linux 生产环境实用命令与性能调优速查</a> <span class="text-neutral-500 text-[10px]">2026-08</span></div>
        <div><span class="text-neutral-500">[4]</span> <a href="/posts/2026/lucky-stun穿透--cloudflare实现无公网ipv4访问与智能分流配置指南/" class="text-cyan-400 hover:text-pink-400 underline transition-colors">🌐 Lucky STUN 穿透 + Cloudflare 无公网 IPv4 访问</a> <span class="text-neutral-500 text-[10px]">2026-08</span></div>
    </div>
    <div class="text-[11px] text-neutral-500 mt-1">👉 点击标题可直接跳转阅读，或访问 <a href="/posts/" class="text-[var(--primary)] hover:underline">/posts/</a> 查看全部文章。</div>
</div>`;
                break;

            case "whoami":
            case "bio":
            case "cat":
                outputHtml = `
<div class="font-mono text-xs space-y-1.5 text-neutral-300 py-1">
    <div class="text-pink-400 font-bold text-sm">🌸 YUME (放课后の技术部部长)</div>
    <div class="text-neutral-300">✨ 专注于网络架构、服务器运维、Docker 与全栈开发的探索之旅。</div>
    <div class="text-emerald-400 italic">“出发！去互联网世界里捡星星～”</div>
    <div class="text-neutral-400 text-[11px] pt-1">
        🔗 GitHub: <a href="https://github.com/YUME-0721" target="_blank" class="text-cyan-400 hover:underline">@YUME-0721</a> · Bilibili: <a href="https://space.bilibili.com/523354432" target="_blank" class="text-cyan-400 hover:underline">@523354432</a>
    </div>
</div>`;
                break;

            case "weather":
            case "curl":
                outputHtml = `
<div class="font-mono text-xs space-y-1 text-neutral-300 py-1">
    <div class="text-cyan-400 font-bold">🌤️ Tech-Dept Local Weather Report:</div>
    <div class="text-neutral-300">
        ┌──────────────┬────────────────────────────────┐<br/>
        │ 天气状况     │ 晴空万里 (Sunny & Clear)        │<br/>
        │ 实时气温     │ 24°C / 舒适                     │<br/>
        │ 网络延迟     │ 18ms (Edge CDN 最优加速中)      │<br/>
        │ 码代码宜忌   │ 【宜】重构架构、写博客、听音乐 │<br/>
        └──────────────┴────────────────────────────────┘
    </div>
</div>`;
                break;

            case "sudo":
                if (lower.includes("rm") || lower.includes("-rf")) {
                    outputHtml = `
<div class="font-mono text-xs space-y-1 py-1 text-red-400">
    <div class="font-bold flex items-center gap-1.5 text-red-500">
        <span>🚨 [SECURITY ALERT] 触发二次元机动要塞安全协议！</span>
    </div>
    <div class="text-neutral-300">Access Denied: 检测到高危指令 <span class="text-red-400 underline">sudo rm -rf /*</span>！</div>
    <div class="text-pink-400">🛡️ 正在启动数据库量子力场护盾... [100%] 保护成功！</div>
    <div class="text-neutral-500 text-[11px]">✨ 温馨提醒：技术部的服务器里装满了可爱的回忆，不能随便删除哦～</div>
</div>`;
                } else {
                    outputHtml = `<div class="font-mono text-xs text-yellow-400">yume is not in the sudoers file. This incident will be reported to the Department Manager. 🌸</div>`;
                }
                break;

            case "music":
                if (typeof window !== "undefined") {
                    const manager = (window as any).__FUWARI_MUSIC_MANAGER__;
                    if (manager) {
                        if (arg === "next") {
                            manager.playNext?.();
                            outputHtml = `<div class="font-mono text-xs text-emerald-400">🎵 已为您切换至下一首曲目！</div>`;
                        } else if (arg === "prev") {
                            manager.playPrev?.();
                            outputHtml = `<div class="font-mono text-xs text-emerald-400">🎵 已为您切换至上一首曲目！</div>`;
                        } else if (arg === "play") {
                            manager.play?.();
                            outputHtml = `<div class="font-mono text-xs text-emerald-400">▶️ 音乐已开始播放！</div>`;
                        } else if (arg === "pause") {
                            manager.pause?.();
                            outputHtml = `<div class="font-mono text-xs text-yellow-400">⏸️ 音乐已暂停。</div>`;
                        } else {
                            outputHtml = `<div class="font-mono text-xs text-neutral-300">用法: <span class="text-cyan-400">music [play|pause|next|prev]</span></div>`;
                        }
                    } else {
                        outputHtml = `<div class="font-mono text-xs text-neutral-400">🎵 音乐管理器正在加载中...</div>`;
                    }
                }
                break;

            case "theme":
                if (arg === "dark" || arg === "light") {
                    if (typeof window !== "undefined" && (window as any).setTheme) {
                        (window as any).setTheme(arg);
                        outputHtml = `<div class="font-mono text-xs text-emerald-400">🎨 已切换全站主题为: <span class="font-bold">${arg}</span></div>`;
                    } else {
                        outputHtml = `<div class="font-mono text-xs text-emerald-400">🎨 主题已设定为: ${arg}</div>`;
                    }
                } else {
                    outputHtml = `<div class="font-mono text-xs text-neutral-300">用法: <span class="text-cyan-400">theme [dark|light]</span></div>`;
                }
                break;

            case "date":
                outputHtml = `<div class="font-mono text-xs text-neutral-300">${new Date().toString()}</div>`;
                break;

            case "history":
                outputHtml = `
<div class="font-mono text-xs space-y-0.5 text-neutral-300 py-1">
    <div class="text-[var(--primary)] font-bold mb-1">📜 指令执行历史:</div>
    ${history.map((h, i) => `<div><span class="text-neutral-500">${i + 1}</span> ${h}</div>`).join("")}
</div>`;
                break;

            default:
                outputHtml = `<div class="font-mono text-xs text-red-400">zsh: command not found: <span class="text-neutral-200 font-bold">${cmd}</span>. 输入 <span class="text-cyan-400 font-bold underline cursor-pointer" onclick="window.runQuickTermCmd('help')">help</span> 查看可用指令。</div>`;
                break;
        }

        outputs = [
            ...outputs,
            {
                id: Math.random().toString(),
                command: cmd,
                type: "html",
                htmlContent: outputHtml,
                timestamp: getNowTime()
            }
        ];

        inputCommand = "";
        scrollToBottom();
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (isMatrixMode) {
            stopMatrixEffect();
            e.preventDefault();
            return;
        }

        if (e.key === "Enter") {
            executeCommand(inputCommand);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (history.length > 0) {
                if (historyIndex > 0) {
                    historyIndex--;
                }
                inputCommand = history[historyIndex] || "";
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (historyIndex < history.length - 1) {
                historyIndex++;
                inputCommand = history[historyIndex] || "";
            } else {
                historyIndex = history.length;
                inputCommand = "";
            }
        } else if (e.key === "Tab") {
            e.preventDefault();
            const lower = inputCommand.toLowerCase().trim();
            if (lower) {
                const match = availableCommands.find(c => c.startsWith(lower));
                if (match) {
                    inputCommand = match;
                }
            }
        }
    }

    function triggerQuickCommand(cmd: string) {
        if (isMatrixMode) stopMatrixEffect();
        inputCommand = cmd;
        executeCommand(cmd);
        focusInput();
    }

    onMount(() => {
        // 绑定全局触发器
        (window as any).runQuickTermCmd = triggerQuickCommand;

        return () => {
            if (matrixInterval) clearInterval(matrixInterval);
        };
    });
</script>

<div class="card-base overflow-hidden relative flex flex-col transition-all duration-300 select-none group/terminal hover:border-[var(--primary)]/40 shadow-lg"
     style={isMinimized ? "height: 38px;" : (isExpanded ? "height: 520px;" : "height: 320px;")}
     onclick={focusInput}
     role="region"
     aria-label="Interactive Terminal Sandbox"
>
    <!-- 顶部 macOS 风格状态与控制栏 -->
    <div class="h-9 px-3.5 bg-black/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-between border-b border-black/5 dark:border-white/5 shrink-0">
        <!-- macOS 窗口红黄绿圆点 -->
        <div class="flex items-center gap-1.5">
            <button
                type="button"
                class="w-3 h-3 rounded-full bg-[#FF5F56] hover:brightness-110 active:scale-90 transition-all cursor-pointer shadow-sm flex items-center justify-center group/dot"
                onclick={(e) => { e.stopPropagation(); outputs = []; }}
                title="清空屏幕 (Clear)"
            >
                <span class="opacity-0 group-hover/dot:opacity-100 text-[8px] font-black text-black/60">×</span>
            </button>
            <button
                type="button"
                class="w-3 h-3 rounded-full bg-[#FFBD2E] hover:brightness-110 active:scale-90 transition-all cursor-pointer shadow-sm flex items-center justify-center group/dot"
                onclick={(e) => { e.stopPropagation(); isMinimized = !isMinimized; }}
                title="折叠/展开终端"
            >
                <span class="opacity-0 group-hover/dot:opacity-100 text-[8px] font-black text-black/60">−</span>
            </button>
            <button
                type="button"
                class="w-3 h-3 rounded-full bg-[#27C93F] hover:brightness-110 active:scale-90 transition-all cursor-pointer shadow-sm flex items-center justify-center group/dot"
                onclick={(e) => { e.stopPropagation(); isExpanded = !isExpanded; }}
                title="切换高展开度"
            >
                <span class="opacity-0 group-hover/dot:opacity-100 text-[7px] font-black text-black/60">+</span>
            </button>
        </div>

        <!-- 终端标题 -->
        <div class="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400">
            <span class="text-[var(--primary)]">bash</span>
            <span class="text-neutral-400 dark:text-neutral-600">:</span>
            <span>yume@tech-dept: ~</span>
        </div>

        <!-- 极客实时状态灯 -->
        <div class="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
            <span class="inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="hidden sm:inline text-neutral-500">LIVE</span>
            </span>
            <span class="hidden md:inline px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-neutral-400 text-[9px]">
                UTF-8
            </span>
        </div>
    </div>

    <!-- 终端输出主体容器 -->
    {#if !isMinimized}
        <div
            bind:this={terminalBodyEl}
            class="terminal-scroll-area flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 font-mono text-xs relative h-full"
        >
            <!-- Matrix 代码雨覆盖层 -->
            {#if isMatrixMode}
                <div class="relative w-full h-full min-h-[200px] rounded-lg overflow-hidden flex flex-col items-center justify-center">
                    <canvas bind:this={matrixCanvasEl} class="absolute inset-0 w-full h-full"></canvas>
                    <div class="absolute bottom-3 bg-black/80 px-3 py-1 rounded-full text-pink-400 font-mono text-xs border border-pink-500/30 backdrop-blur-md shadow-lg animate-bounce pointer-events-none">
                        ⌨️ 正在运行黑客帝国代码雨 · 按任意键或点击退出
                    </div>
                </div>
            {/if}

            <!-- 历史输出流 -->
            {#each outputs as item (item.id)}
                <div class="space-y-1 animate-fadeIn">
                    <!-- 命令行回显 -->
                    <div class="flex items-center gap-2 text-neutral-400 font-mono">
                        <span class="text-[var(--primary)] font-bold">yume@tech-dept</span>
                        <span class="text-neutral-600 dark:text-neutral-500">:</span>
                        <span class="text-cyan-400 font-bold">~</span>
                        <span class="text-emerald-400 font-bold">$</span>
                        <span class="text-neutral-100 font-bold">{item.command}</span>
                        <span class="text-[10px] text-neutral-600 ml-auto">{item.timestamp}</span>
                    </div>

                    <!-- 格式化输出 -->
                    {#if item.type === "html" && item.htmlContent}
                        <div class="pl-2 border-l-2 border-[var(--primary)]/30 py-0.5">
                            {@html item.htmlContent}
                        </div>
                    {/if}
                </div>
            {/each}

            <!-- 当前输入行 -->
            {#if !isMatrixMode}
                <div class="flex items-center gap-2 font-mono text-xs">
                    <span class="text-[var(--primary)] font-bold shrink-0">yume@tech-dept</span>
                    <span class="text-neutral-600 dark:text-neutral-500 shrink-0">:</span>
                    <span class="text-cyan-400 font-bold shrink-0">~</span>
                    <span class="text-emerald-400 font-bold shrink-0">$</span>
                    <input
                        bind:this={inputEl}
                        bind:value={inputCommand}
                        onkeydown={handleKeyDown}
                        type="text"
                        spellcheck="false"
                        autocomplete="off"
                        autocapitalize="off"
                        class="flex-1 bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none caret-[var(--primary)] font-mono text-xs p-0 border-none m-0 selection:bg-[var(--primary)] selection:text-white"
                        placeholder="输入指令 (输入 help 查看手册)..."
                    />
                </div>
            {/if}
        </div>

        <!-- 底部快捷指令胶囊栏 -->
        <div class="px-3.5 py-2 bg-black/5 dark:bg-black/20 border-t border-black/5 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <span class="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider shrink-0 mr-1">
                QUICK:
            </span>
            {#each quickCommands as item}
                <button
                    type="button"
                    class="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-[var(--primary)] hover:text-white dark:hover:bg-[var(--primary)] dark:hover:text-white text-[11px] font-mono font-semibold text-neutral-600 dark:text-neutral-300 transition-all border border-black/5 dark:border-white/5 active:scale-95 shrink-0 shadow-sm"
                    onclick={(e) => { e.stopPropagation(); triggerQuickCommand(item.cmd); }}
                >
                    {item.label}
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    /* 极细暗色自定义滚动条，彻底消除系统白色宽滚动条 */
    .terminal-scroll-area {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
    }
    .terminal-scroll-area::-webkit-scrollbar {
        width: 4px;
        height: 4px;
    }
    .terminal-scroll-area::-webkit-scrollbar-track {
        background: transparent;
    }
    .terminal-scroll-area::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 9999px;
    }
    .terminal-scroll-area::-webkit-scrollbar-thumb:hover {
        background: var(--primary);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(2px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-fadeIn {
        animation: fadeIn 0.15s ease-out forwards;
    }
</style>
