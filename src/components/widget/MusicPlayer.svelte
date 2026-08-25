<script lang="ts">
import Icon from "@iconify/svelte";
import { onDestroy, onMount } from "svelte";

export let title = "音乐盒";
export let server = "netease";
export let type = "playlist";
export let id = "914046086";
export let autoPlay = false;
export let defaultVolume = 0.7;

interface Song {
	title: string;
	author: string;
	url: string;
	pic: string;
	lrc?: string;
}

interface ParsedLyric {
	time: number;
	text: string;
}

interface MusicManager {
	audio: HTMLAudioElement;
	playlist: Song[];
	currentIndex: number;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	isMuted: boolean;
	loopMode: "order" | "random" | "single";
	showLyrics: boolean;
	parsedLyrics: ParsedLyric[];
	currentLyricText: string;
	server: string;
	type: string;
	id: string;
	consecutiveErrors: number;
	listeners: Set<() => void>;
	notify: () => void;
	loadLyrics: (lrcSource?: string) => Promise<void>;
	loadSong: (index: number, playNow?: boolean, forceReload?: boolean) => void;
	togglePlay: () => void;
	prevSong: () => void;
	nextSong: () => void;
	seek: (time: number) => void;
	setVolume: (vol: number) => void;
	toggleMute: () => void;
	toggleLoopMode: () => void;
	toggleLyrics: () => void;
	fetchPlaylist: (
		server: string,
		type: string,
		id: string,
		autoStart: boolean,
		cacheKey: string,
	) => Promise<void>;
}

declare global {
	interface Window {
		__FUWARI_MUSIC_MANAGER__?: MusicManager;
	}
}

let playlist: Song[] = [];
let currentIndex = 0;
let isPlaying = false;
let currentTime = 0;
let duration = 0;
let volume = defaultVolume;
let isMuted = false;
let showVolumeSlider = false;
let loopMode: "order" | "random" | "single" = "order";
let showPlaylist = false;
let showLyrics = false;
let currentLyricText = "";

const CACHE_KEY = `fuwari_music_cache_${server}_${type}_${id}`;

$: currentSong = playlist[currentIndex] || {
	title: "加载中...",
	author: "请稍候",
	url: "",
	pic: "/favicon/favicon.svg",
};

$: progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

function formatTime(seconds: number): string {
	if (isNaN(seconds) || seconds < 0) return "0:00";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function extractSongId(urlStr?: string): string | null {
	if (!urlStr) return null;
	const match = urlStr.match(/id=(\d+)/);
	return match ? match[1] : null;
}

function getOptimizedCover(picUrl?: string): string {
	if (!picUrl) return "/favicon/favicon.svg";
	if (picUrl.includes("music.126.net")) {
		const clean = picUrl.split("?")[0];
		return `${clean}?param=140y140`;
	}
	return picUrl;
}

function preloadImage(url: string) {
	if (typeof window !== "undefined" && url) {
		const img = new Image();
		img.src = getOptimizedCover(url);
	}
}

function parseLrc(lrcText?: string): ParsedLyric[] {
	if (!lrcText) return [];
	const lines = lrcText.split("\n");
	const result: ParsedLyric[] = [];
	const timeReg = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

	for (const line of lines) {
		const matches = [...line.matchAll(timeReg)];
		const text = line.replace(timeReg, "").trim();
		if (!text) continue;

		for (const m of matches) {
			const min = parseInt(m[1], 10);
			const sec = parseInt(m[2], 10);
			const ms = m[3] ? parseInt(m[3], 10) / (m[3].length === 2 ? 100 : 1000) : 0;
			result.push({ time: min * 60 + sec + ms, text });
		}
	}
	return result.sort((a, b) => a.time - b.time);
}

function getOrCreateGlobalManager(): MusicManager {
	if (window.__FUWARI_MUSIC_MANAGER__) {
		return window.__FUWARI_MUSIC_MANAGER__;
	}

	const audio = new Audio();
	audio.volume = defaultVolume;

	const manager: MusicManager = {
		audio,
		playlist: [],
		currentIndex: 0,
		isPlaying: false,
		currentTime: 0,
		duration: 0,
		volume: defaultVolume,
		isMuted: false,
		loopMode: "order",
		showLyrics: false,
		parsedLyrics: [],
		currentLyricText: "",
		server,
		type,
		id,
		consecutiveErrors: 0,
		listeners: new Set(),
		notify() {
			for (const listener of this.listeners) {
				listener();
			}
		},
		async loadLyrics(lrcSource?: string) {
			if (!lrcSource) {
				this.parsedLyrics = [];
				this.currentLyricText = "";
				this.notify();
				return;
			}
			if (lrcSource.startsWith("http://") || lrcSource.startsWith("https://")) {
				try {
					const res = await fetch(lrcSource);
					if (res.ok) {
						const text = await res.text();
						this.parsedLyrics = parseLrc(text);
						this.notify();
						return;
					}
				} catch (e) {
					console.warn("Failed to fetch lyrics:", e);
				}
			}
			this.parsedLyrics = parseLrc(lrcSource);
			this.notify();
		},
		loadSong(index: number, playNow = false, forceReload = false) {
			if (!this.playlist.length) return;
			const targetIndex = (index + this.playlist.length) % this.playlist.length;
			const song = this.playlist[targetIndex];
			if (!song || !this.audio) return;

			// 如果同一首歌正在播放或音频已装载且非强制重新装载，则直接保持播放，绝不中断！
			const songId = extractSongId(song.url);
			const targetSrc = (this.server === "netease" && songId)
				? `https://music.163.com/song/media/outer/url?id=${songId}.mp3`
				: song.url;

			if (!forceReload && this.currentIndex === targetIndex && this.audio.src === targetSrc) {
				if (playNow && this.audio.paused) {
					this.audio.play().then(() => {
						this.isPlaying = true;
						this.notify();
					}).catch(() => {});
				}
				return;
			}

			this.currentIndex = targetIndex;
			preloadImage(song.pic);
			const nextSongItem = this.playlist[(this.currentIndex + 1) % this.playlist.length];
			if (nextSongItem) preloadImage(nextSongItem.pic);

			this.audio.src = targetSrc;
			this.audio.load();
			this.loadLyrics(song.lrc);
			this.currentLyricText = "";
			this.currentTime = 0;
			this.notify();

			if (playNow) {
				this.audio.play().then(() => {
					this.isPlaying = true;
					this.consecutiveErrors = 0;
					this.notify();
				}).catch((err) => {
					console.warn("Primary play error, fallback to raw url", err);
					if (this.audio.src !== song.url) {
						this.audio.src = song.url;
						this.audio.load();
						this.audio.play().then(() => {
							this.isPlaying = true;
							this.consecutiveErrors = 0;
							this.notify();
						}).catch((e) => {
							console.error("Playback error:", e);
							this.isPlaying = false;
							this.notify();
						});
					} else {
						this.isPlaying = false;
						this.notify();
					}
				});
			}
		},
		togglePlay() {
			if (!this.audio) return;
			if (this.isPlaying) {
				this.audio.pause();
				this.isPlaying = false;
				this.notify();
			} else {
				const song = this.playlist[this.currentIndex];
				if (!this.audio.src || this.audio.src === "" || this.audio.src === window.location.href) {
					if (song) {
						this.loadSong(this.currentIndex, true, true);
						return;
					}
				}
				this.audio.play().then(() => {
					this.isPlaying = true;
					this.consecutiveErrors = 0;
					this.notify();
				}).catch((err) => {
					console.warn("Play error, trying fallback stream...", err);
					const songId = song ? extractSongId(song.url) : null;
					if (songId) {
						this.audio.src = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;
						this.audio.load();
						this.audio.play().then(() => {
							this.isPlaying = true;
							this.consecutiveErrors = 0;
							this.notify();
						}).catch((e) => {
							console.error("Audio error:", e);
							this.isPlaying = false;
							this.notify();
						});
					} else {
						this.isPlaying = false;
						this.notify();
					}
				});
			}
		},
		prevSong() {
			if (this.loopMode === "random") {
				const nextIdx = Math.floor(Math.random() * this.playlist.length);
				this.loadSong(nextIdx, true, true);
			} else {
				this.loadSong(this.currentIndex - 1, true, true);
			}
		},
		nextSong() {
			if (this.loopMode === "random") {
				const nextIdx = Math.floor(Math.random() * this.playlist.length);
				this.loadSong(nextIdx, true, true);
			} else {
				this.loadSong(this.currentIndex + 1, true, true);
			}
		},
		seek(time: number) {
			if (!this.audio || !this.duration) return;
			this.audio.currentTime = time;
			this.currentTime = time;
			this.notify();
		},
		setVolume(vol: number) {
			this.volume = vol;
			this.isMuted = vol === 0;
			if (this.audio) {
				this.audio.volume = vol;
				this.audio.muted = this.isMuted;
			}
			this.notify();
		},
		toggleMute() {
			if (!this.audio) return;
			this.isMuted = !this.isMuted;
			this.audio.muted = this.isMuted;
			this.notify();
		},
		toggleLoopMode() {
			if (this.loopMode === "order") this.loopMode = "single";
			else if (this.loopMode === "single") loopMode = "random";
			else this.loopMode = "order";
			this.notify();
		},
		toggleLyrics() {
			this.showLyrics = !this.showLyrics;
			this.notify();
		},
		async fetchPlaylist(srv, typ, playlistId, autoStart, cKey) {
			const hasValidAudio = this.audio && this.audio.src && this.audio.src !== "" && this.audio.src !== window.location.href;

			try {
				const cached = localStorage.getItem(cKey);
				if (cached) {
					const data = JSON.parse(cached);
					if (Array.isArray(data) && data.length > 0) {
						this.playlist = data;
						if (!hasValidAudio) {
							this.currentIndex = 0;
							this.loadSong(this.currentIndex, autoStart, true);
						}
						this.notify();
					}
				}
			} catch (e) {}

			try {
				const res = await fetch(
					`https://api.i-meto.com/meting/api?server=${srv}&type=${typ}&id=${playlistId}&r=${Math.random()}`
				);
				if (res.ok) {
					const data = await res.json();
					if (Array.isArray(data) && data.length > 0) {
						this.playlist = data;
						try {
							localStorage.setItem(cKey, JSON.stringify(data));
						} catch (e) {}
						if (!this.audio.src || this.audio.src === "" || this.audio.src === window.location.href) {
							this.currentIndex = 0;
							this.loadSong(this.currentIndex, autoStart, true);
						}
						this.notify();
					}
				}
			} catch (e) {
				console.warn("Failed to fetch playlist from Meting API", e);
			}
		},
	};

	// Bind persistent event listeners to global Audio
	audio.addEventListener("timeupdate", () => {
		manager.currentTime = audio.currentTime;
		manager.duration = audio.duration || 0;

		if (manager.parsedLyrics.length > 0) {
			for (let i = manager.parsedLyrics.length - 1; i >= 0; i--) {
				if (manager.currentTime >= manager.parsedLyrics[i].time) {
					manager.currentLyricText = manager.parsedLyrics[i].text;
					break;
				}
			}
		}
		manager.notify();
	});

	audio.addEventListener("ended", () => {
		if (manager.loopMode === "single") {
			audio.currentTime = 0;
			audio.play();
		} else {
			manager.nextSong();
		}
	});

	audio.addEventListener("error", () => {
		const song = manager.playlist[manager.currentIndex];
		if (!song || !audio) return;
		const songId = extractSongId(song.url);
		if (songId && !audio.src.includes("music.163.com/song/media/outer")) {
			audio.src = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;
			audio.load();
			if (manager.isPlaying) {
				audio.play().catch(() => {
					manager.consecutiveErrors++;
					if (manager.consecutiveErrors < 3) manager.nextSong();
					else {
						manager.isPlaying = false;
						manager.notify();
					}
				});
			}
		} else {
			manager.consecutiveErrors++;
			if (manager.consecutiveErrors < 3) manager.nextSong();
			else {
				manager.isPlaying = false;
				manager.notify();
			}
		}
	});

	audio.addEventListener("loadedmetadata", () => {
		manager.duration = audio.duration || 0;
		manager.notify();
	});

	audio.addEventListener("play", () => {
		manager.isPlaying = true;
		manager.notify();
	});

	audio.addEventListener("pause", () => {
		manager.isPlaying = false;
		manager.notify();
	});

	window.__FUWARI_MUSIC_MANAGER__ = manager;
	return manager;
}

let syncCallback: () => void;

onMount(() => {
	const mgr = getOrCreateGlobalManager();

	// Sync current state to local component
	const syncState = () => {
		playlist = mgr.playlist;
		currentIndex = mgr.currentIndex;
		isPlaying = mgr.isPlaying;
		currentTime = mgr.currentTime;
		duration = mgr.duration;
		volume = mgr.volume;
		isMuted = mgr.isMuted;
		loopMode = mgr.loopMode;
		showLyrics = mgr.showLyrics;
		currentLyricText = mgr.currentLyricText;
	};

	syncCallback = syncState;
	mgr.listeners.add(syncCallback);
	syncState();

	// 只有当全局尚未加载过歌单或歌单 ID 发生改变时才拉取，决不打断已有音频！
	if (!mgr.playlist.length || mgr.id !== id || mgr.server !== server) {
		mgr.server = server;
		mgr.type = type;
		mgr.id = id;
		mgr.fetchPlaylist(server, type, id, autoPlay, CACHE_KEY);
	}
});

onDestroy(() => {
	if (typeof window !== "undefined" && window.__FUWARI_MUSIC_MANAGER__ && syncCallback) {
		window.__FUWARI_MUSIC_MANAGER__.listeners.delete(syncCallback);
		// 音频在全局 window 单例中常驻播放，切页不中断！
	}
});

function handlePlayToggle() {
	window.__FUWARI_MUSIC_MANAGER__?.togglePlay();
}

function handlePrev() {
	window.__FUWARI_MUSIC_MANAGER__?.prevSong();
}

function handleNext() {
	window.__FUWARI_MUSIC_MANAGER__?.nextSong();
}

function handleLoopToggle() {
	window.__FUWARI_MUSIC_MANAGER__?.toggleLoopMode();
}

function handleLyricsToggle() {
	window.__FUWARI_MUSIC_MANAGER__?.toggleLyrics();
}

function handleSeek(e: MouseEvent) {
	const mgr = window.__FUWARI_MUSIC_MANAGER__;
	if (!mgr || !duration) return;
	const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
	const clickX = e.clientX - rect.left;
	const newTime = (clickX / rect.width) * duration;
	mgr.seek(newTime);
}

function handleVolumeChange(e: Event) {
	const target = e.target as HTMLInputElement;
	const val = parseFloat(target.value);
	window.__FUWARI_MUSIC_MANAGER__?.setVolume(val);
}

function handleMuteToggle() {
	window.__FUWARI_MUSIC_MANAGER__?.toggleMute();
}

function handleSelectSong(idx: number) {
	const mgr = window.__FUWARI_MUSIC_MANAGER__;
	if (mgr) {
		mgr.consecutiveErrors = 0;
		mgr.loadSong(idx, true, true);
		showPlaylist = false;
	}
}
</script>

<div class="card-base p-3.5 w-full select-none relative overflow-hidden transition-all duration-300">
    <!-- Header Title & Quick Action Icons -->
    <div class="flex items-center justify-between mb-2.5">
        <div class="flex items-center gap-1.5 font-bold text-[15px] text-neutral-900 dark:text-neutral-100">
            <Icon icon="material-symbols:music-note-rounded" class="text-base text-[var(--primary)] shrink-0" />
            <span>{title}</span>
        </div>

        <div class="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500">
            <!-- Lyrics Toggle -->
            <button
                on:click={handleLyricsToggle}
                class="p-1 rounded-md hover:text-[var(--primary)] hover:bg-black/5 dark:hover:bg-white/5 transition"
                title={showLyrics ? "隐藏歌词" : "显示歌词"}
            >
                <Icon icon={showLyrics ? "material-symbols:subtitles-rounded" : "material-symbols:subtitles-off-outline-rounded"} class="text-base {showLyrics ? 'text-[var(--primary)]' : ''}" />
            </button>

            <!-- Volume Icon & Expandable Slider Button -->
            <div class="relative flex items-center">
                <button
                    on:click={() => (showVolumeSlider = !showVolumeSlider)}
                    class="p-1 rounded-md hover:text-[var(--primary)] hover:bg-black/5 dark:hover:bg-white/5 transition"
                    title="调节音量"
                >
                    <Icon icon={isMuted || volume === 0 ? "material-symbols:volume-off-rounded" : "material-symbols:volume-up-rounded"} class="text-base {showVolumeSlider ? 'text-[var(--primary)]' : ''}" />
                </button>

                {#if showVolumeSlider}
                    <div class="absolute right-0 top-7 z-30 p-2 rounded-xl bg-[var(--float-panel-bg-opaque)] border border-black/10 dark:border-white/10 shadow-lg flex items-center gap-2 animate-fade-in backdrop-blur-md">
                        <button on:click={handleMuteToggle} class="text-neutral-400 hover:text-[var(--primary)] transition">
                            <Icon icon={isMuted ? "material-symbols:volume-off-rounded" : "material-symbols:volume-up-rounded"} class="text-sm" />
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            on:input={handleVolumeChange}
                            class="w-20 h-1 bg-black/15 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                        />
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Song Information Row -->
    <div class="flex items-center gap-3">
        <!-- Rotating Album Disc (全局单例常驻，切页无缝旋转) -->
        <div class="relative w-12 h-12 shrink-0 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
            <img
                src={getOptimizedCover(currentSong.pic)}
                alt={currentSong.title}
                width="48"
                height="48"
                loading="eager"
                decoding="async"
                fetchpriority="high"
                class="w-12 h-12 rounded-full object-cover shadow-sm border border-black/10 dark:border-white/15 {isPlaying ? 'animate-spin-slow' : ''}"
            />
            <div class="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-700 pointer-events-none"></div>
        </div>

        <!-- Song Title & Artist -->
        <div class="flex-1 min-w-0 flex flex-col justify-center">
            <div class="font-bold text-[14px] leading-tight text-neutral-800 dark:text-neutral-100 truncate" title={currentSong.title}>
                {currentSong.title}
            </div>
            <div class="text-[11.5px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5" title={currentSong.author}>
                {currentSong.author}
            </div>
        </div>

        <!-- Time Badge -->
        <div class="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 tabular-nums shrink-0 text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
        </div>
    </div>

    <!-- Scrolling Lyrics Popover -->
    {#if showLyrics && currentLyricText}
        <div class="mt-2 px-2.5 py-1 rounded-lg bg-[var(--float-panel-bg-opaque)] text-center text-xs font-medium text-[var(--primary)] border border-[var(--primary)]/20 truncate animate-fade-in">
            {currentLyricText}
        </div>
    {/if}

    <!-- Interactive Progress Scrub Bar -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="w-full h-1.5 hover:h-2 bg-black/10 dark:bg-white/10 rounded-full cursor-pointer relative overflow-hidden transition-all my-2.5"
        on:click={handleSeek}
        title="点击跳转播放进度"
    >
        <div
            class="h-full bg-[var(--primary)] rounded-full transition-all duration-100"
            style="width: {progressPercent}%"
        ></div>
    </div>

    <!-- Bottom Functional Control Bar -->
    <div class="flex items-center justify-between px-1 text-neutral-600 dark:text-neutral-300">
        <!-- Loop Mode Button -->
        <button
            on:click={handleLoopToggle}
            class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--primary)] transition"
            title={loopMode === 'order' ? '列表循环' : loopMode === 'single' ? '单曲循环' : '随机播放'}
        >
            {#if loopMode === "order"}
                <Icon icon="material-symbols:repeat-rounded" class="text-base" />
            {:else if loopMode === "single"}
                <Icon icon="material-symbols:repeat-one-rounded" class="text-base text-[var(--primary)]" />
            {:else}
                <Icon icon="material-symbols:shuffle-rounded" class="text-base text-[var(--primary)]" />
            {/if}
        </button>

        <!-- Previous Song Button -->
        <button
            on:click={handlePrev}
            class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--primary)] transition"
            title="上一曲"
        >
            <Icon icon="material-symbols:skip-previous-rounded" class="text-xl" />
        </button>

        <!-- Compact Circular Play/Pause Button -->
        <button
            on:click={handlePlayToggle}
            class="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all flex items-center justify-center text-[var(--primary)] shadow-sm"
            title={isPlaying ? "暂停" : "播放"}
        >
            <Icon icon={isPlaying ? "material-symbols:pause-rounded" : "material-symbols:play-arrow-rounded"} class="text-xl translate-x-[0.5px]" />
        </button>

        <!-- Next Song Button -->
        <button
            on:click={handleNext}
            class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--primary)] transition"
            title="下一曲"
        >
            <Icon icon="material-symbols:skip-next-rounded" class="text-xl" />
        </button>

        <!-- Playlist Drawer Toggle Button -->
        <button
            on:click={() => (showPlaylist = !showPlaylist)}
            class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 {showPlaylist ? 'text-[var(--primary)] bg-black/5 dark:bg-white/10' : ''} transition"
            title="播放列表"
        >
            <Icon icon="material-symbols:queue-music-rounded" class="text-base" />
        </button>
    </div>

    <!-- Playlist Drawer (Accordion Dropdown) -->
    {#if showPlaylist}
        <div class="music-playlist-scrollbar mt-2.5 pt-2.5 border-t border-black/10 dark:border-white/10 max-h-48 overflow-y-auto overflow-x-hidden space-y-0.5 text-xs animate-fade-in w-full">
            {#each playlist as song, idx}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    on:click={() => handleSelectSong(idx)}
                    class="flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition w-full overflow-hidden {idx === currentIndex ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'}"
                >
                    <div class="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                        <span class="w-4 text-center text-[10px] text-neutral-400 shrink-0">{idx + 1}</span>
                        <span class="truncate block flex-1" title={song.title}>{song.title}</span>
                    </div>
                    <span class="text-[10.5px] text-neutral-400 dark:text-neutral-500 shrink-0 truncate max-w-[38%] text-right" title={song.author}>{song.author}</span>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
.music-playlist-scrollbar {
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.music-playlist-scrollbar::-webkit-scrollbar {
    display: none;
}
@keyframes spin-slow {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
.animate-spin-slow {
    animation: spin-slow 14s linear infinite;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-3px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
    animation: fadeIn 0.15s ease-out;
}
</style>
