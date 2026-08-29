<script lang="ts">
import Icon from "@iconify/svelte";
import { onDestroy, onMount } from "svelte";
import type { Song, ParsedLyric, MusicManager } from "../../types/music";

export let title = "音乐";
export let server = "netease";
export let type = "playlist";
export let id = "914046086";
export let autoPlay = false;
export let defaultVolume = 0.7;

function getGlobalMusicManager(): MusicManager | undefined {
	if (typeof window !== "undefined") {
		return (window as any).__FUWARI_MUSIC_MANAGER__;
	}
	return undefined;
}

function setGlobalMusicManager(mgr: MusicManager) {
	if (typeof window !== "undefined") {
		(window as any).__FUWARI_MUSIC_MANAGER__ = mgr;
	}
}

// 组件初始化瞬间立即同步全局单例已有状态，杜绝任何中间状态闪烁
const initialGlobalMgr = getGlobalMusicManager();

let playlist: Song[] = initialGlobalMgr?.playlist || [];
let currentIndex = initialGlobalMgr?.currentIndex || 0;
let isPlaying = initialGlobalMgr?.isPlaying || false;
let currentTime = initialGlobalMgr?.currentTime || 0;
let duration = initialGlobalMgr?.duration || 0;
let volume = initialGlobalMgr?.volume ?? defaultVolume;
let isMuted = initialGlobalMgr?.isMuted || false;
let showVolumeSlider = false;
let loopMode: "order" | "random" | "single" = initialGlobalMgr?.loopMode || "order";
let showPlaylist = initialGlobalMgr?.showPlaylist || false;
let showLyrics = initialGlobalMgr?.showLyrics || false;
let parsedLyrics: ParsedLyric[] = initialGlobalMgr?.parsedLyrics || [];
let currentLyricText = initialGlobalMgr?.currentLyricText || "";
let currentLyricIndex = initialGlobalMgr?.currentLyricIndex ?? -1;

// 歌词滚动与滚动条 DOM 引用及状态
let lyricsScrollEl: HTMLElement | null = null;
let trackEl: HTMLElement | null = null;
let thumbTop = 0;
let thumbHeight = 24;
let isDraggingThumb = false;
let startDragY = 0;
let startDragScrollTop = 0;
let isUserInteracting = false;
let userScrollTimeout: any = null;

const CACHE_KEY = `fuwari_music_cache_${server}_${type}_${id}`;
const STATE_CACHE_KEY = "fuwari_music_player_state";

let lastSavedTime = 0;
function savePlayerState(mgr: MusicManager) {
	if (typeof window === "undefined" || !mgr) return;
	const now = Date.now();
	if (mgr.isPlaying && Math.abs(mgr.currentTime - lastSavedTime) < 1.5) {
		return;
	}
	try {
		const state = {
			currentIndex: mgr.currentIndex,
			currentTime: mgr.currentTime,
			isPlaying: mgr.isPlaying,
			volume: mgr.volume,
			isMuted: mgr.isMuted,
			loopMode: mgr.loopMode,
			showLyrics: mgr.showLyrics,
			timestamp: now,
		};
		localStorage.setItem(STATE_CACHE_KEY, JSON.stringify(state));
		lastSavedTime = mgr.currentTime;
	} catch (e) {}
}

$: currentSong = (playlist && playlist[currentIndex]) || (initialGlobalMgr?.playlist && initialGlobalMgr.playlist[initialGlobalMgr.currentIndex]) || {
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

/**
 * 增强型歌词解析：支持双语翻译合并与单行括号翻译解析
 */
function parseLrc(lrcText?: string): ParsedLyric[] {
	if (!lrcText) return [];
	const lines = lrcText.split("\n");
	const rawItems: { time: number; text: string }[] = [];
	const timeReg = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

	for (const line of lines) {
		const trimmedLine = line.trim();
		if (!trimmedLine) continue;
		// 过滤元数据标签
		if (/^\[(ti|ar|al|by|offset|length):.*\]$/i.test(trimmedLine)) continue;

		const matches = [...trimmedLine.matchAll(timeReg)];
		const text = trimmedLine.replace(timeReg, "").trim();
		if (!text) continue;

		for (const m of matches) {
			const min = parseInt(m[1], 10);
			const sec = parseInt(m[2], 10);
			const ms = m[3] ? parseInt(m[3], 10) / (m[3].length === 2 ? 100 : 1000) : 0;
			rawItems.push({ time: min * 60 + sec + ms, text });
		}
	}

	rawItems.sort((a, b) => a.time - b.time);

	// 合并相同或极相近时间戳的双语翻译
	const merged: ParsedLyric[] = [];
	for (const item of rawItems) {
		const last = merged[merged.length - 1];
		if (last && Math.abs(last.time - item.time) < 0.25) {
			if (!last.translation) {
				last.translation = item.text.startsWith("(") || item.text.startsWith("（")
					? item.text
					: `(${item.text})`;
			} else {
				last.translation += ` ${item.text}`;
			}
		} else {
			// 单行内若已有括号翻译（如: Half asleep (半睡半醒)），则优雅拆分为主句与翻译副句
			const parenMatch = item.text.match(/^(.*?)[\s]*[(\（]([^\)\）]+)[)\）]$/);
			if (parenMatch && parenMatch[1].trim() && parenMatch[2].trim()) {
				merged.push({
					time: item.time,
					text: parenMatch[1].trim(),
					translation: `(${parenMatch[2].trim()})`,
				});
			} else {
				merged.push({
					time: item.time,
					text: item.text,
				});
			}
		}
	}
	return merged;
}

function getOrCreateGlobalManager(): MusicManager {
	const existing = getGlobalMusicManager();
	if (existing) {
		return existing;
	}

	let cachedState: any = null;
	if (typeof window !== "undefined") {
		try {
			const stateStr = localStorage.getItem(STATE_CACHE_KEY);
			if (stateStr) {
				cachedState = JSON.parse(stateStr);
			}
		} catch (e) {}
	}

	const audio = (typeof window !== "undefined" && (window as any).__FUWARI_AUDIO__)
		? (window as any).__FUWARI_AUDIO__
		: new Audio();
	if (typeof window !== "undefined") {
		(window as any).__FUWARI_AUDIO__ = audio;
	}

	const initVolume = cachedState?.volume ?? defaultVolume;
	const initMuted = cachedState?.isMuted ?? false;
	audio.volume = initVolume;
	audio.muted = initMuted;

	const manager: MusicManager = {
		audio,
		playlist: [],
		currentIndex: cachedState?.currentIndex || 0,
		isPlaying: false,
		currentTime: cachedState?.currentTime || 0,
		duration: 0,
		volume: initVolume,
		isMuted: initMuted,
		loopMode: cachedState?.loopMode || "order",
		showLyrics: cachedState?.showLyrics ?? false,
		showPlaylist: false,
		parsedLyrics: [],
		currentLyricText: "",
		currentLyricIndex: -1,
		server,
		type,
		id: String(id),
		consecutiveErrors: 0,
		isPlaylistLoaded: false,
		hasInitialized: true,
		listeners: new Set(),
		notify() {
			for (const listener of this.listeners) {
				try {
					listener();
				} catch (e) {}
			}
			savePlayerState(this);
		},
		async loadLyrics(lrcSource?: string) {
			if (!lrcSource) {
				this.parsedLyrics = [];
				this.currentLyricText = "";
				this.currentLyricIndex = -1;
				this.notify();
				return;
			}
			if (lrcSource.startsWith("http://") || lrcSource.startsWith("https://")) {
				try {
					const res = await fetch(lrcSource);
					if (res.ok) {
						const text = await res.text();
						this.parsedLyrics = parseLrc(text);
						this.currentLyricIndex = -1;
						this.notify();
						return;
					}
				} catch (e) {
					console.warn("Failed to fetch lyrics:", e);
				}
			}
			this.parsedLyrics = parseLrc(lrcSource);
			this.currentLyricIndex = -1;
			this.notify();
		},
		loadSong(index: number, playNow = false, forceReload = false) {
			if (!this.playlist.length) return;
			const targetIndex = (index + this.playlist.length) % this.playlist.length;
			const song = this.playlist[targetIndex];
			if (!song || !this.audio) return;

			const songId = extractSongId(song.url);
			const targetSrc = (this.server === "netease" && songId)
				? `https://music.163.com/song/media/outer/url?id=${songId}.mp3`
				: song.url;

			const hasValidAudio = this.audio.src && this.audio.src !== "" && this.audio.src !== window.location.href;
			// 正在播放且同一首歌，且非强制切歌时，绝不重新 load 从而打断音频
			if (!forceReload && hasValidAudio && this.currentIndex === targetIndex) {
				if (playNow && this.audio.paused) {
					this.play();
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
			this.currentLyricIndex = -1;
			this.currentTime = 0;
			this.notify();

			if (playNow) {
				this.play();
			}
		},
		async play() {
			if (!this.audio) return;
			const song = this.playlist[this.currentIndex];
			if (!this.audio.src || this.audio.src === "" || this.audio.src === window.location.href) {
				if (song) {
					this.loadSong(this.currentIndex, true, true);
					return;
				}
			}
			try {
				await this.audio.play();
				this.isPlaying = true;
				this.consecutiveErrors = 0;
				this.notify();
			} catch (err) {
				console.warn("Primary play error, trying fallback stream...", err);
				const songId = song ? extractSongId(song.url) : null;
				if (songId && !this.audio.src.includes("music.163.com/song/media/outer")) {
					this.audio.src = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;
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
				} else if (song && this.audio.src !== song.url) {
					this.audio.src = song.url;
					this.audio.load();
					this.audio.play().then(() => {
						this.isPlaying = true;
						this.consecutiveErrors = 0;
						this.notify();
					}).catch(() => {
						this.isPlaying = false;
						this.notify();
					});
				} else {
					this.isPlaying = false;
					this.notify();
				}
			}
		},
		pause() {
			if (this.audio) {
				this.audio.pause();
				this.isPlaying = false;
				this.notify();
			}
		},
		togglePlay() {
			if (this.isPlaying) {
				this.pause();
			} else {
				this.play();
			}
		},
		prevSong() {
			if (!this.playlist.length) return;
			if (this.loopMode === "random") {
				const nextIdx = Math.floor(Math.random() * this.playlist.length);
				this.loadSong(nextIdx, true, true);
			} else {
				this.loadSong((this.currentIndex - 1 + this.playlist.length) % this.playlist.length, true, true);
			}
		},
		nextSong() {
			if (!this.playlist.length) return;
			if (this.loopMode === "random") {
				const nextIdx = Math.floor(Math.random() * this.playlist.length);
				this.loadSong(nextIdx, true, true);
			} else {
				this.loadSong((this.currentIndex + 1) % this.playlist.length, true, true);
			}
		},
		playPrev() {
			this.prevSong();
		},
		playNext() {
			this.nextSong();
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
			else if (this.loopMode === "single") this.loopMode = "random";
			else this.loopMode = "order";
			this.notify();
		},
		toggleLyrics() {
			this.showLyrics = !this.showLyrics;
			this.notify();
		},
		togglePlaylist() {
			this.showPlaylist = !this.showPlaylist;
			this.notify();
		},
		async fetchPlaylist(srv, typ, playlistId, autoStart, cKey) {
			if (this.isPlaylistLoaded && this.playlist.length > 0) {
				return;
			}

			let latestCachedState: any = null;
			try {
				const s = localStorage.getItem(STATE_CACHE_KEY);
				if (s) latestCachedState = JSON.parse(s);
			} catch (e) {}

			const restorePlayback = (dataLength: number) => {
				const hasValidAudio = this.audio && this.audio.src && this.audio.src !== "" && this.audio.src !== window.location.href;
				if (hasValidAudio && !this.audio.paused) {
					this.isPlaying = true;
					this.notify();
					return;
				}

				let targetIdx = this.currentIndex;
				if (targetIdx >= dataLength) targetIdx = 0;
				let playNow = autoStart;
				if (latestCachedState && latestCachedState.isPlaying && (Date.now() - latestCachedState.timestamp < 30000)) {
					playNow = true;
					if (latestCachedState.currentTime > 0) {
						this.pendingSeekTime = latestCachedState.currentTime;
					}
				}
				this.loadSong(targetIdx, playNow, false);
			};

			try {
				const cached = localStorage.getItem(cKey);
				if (cached) {
					const data = JSON.parse(cached);
					if (Array.isArray(data) && data.length > 0) {
						this.playlist = data;
						this.isPlaylistLoaded = true;
						const hasValidAudio = this.audio && this.audio.src && this.audio.src !== "" && this.audio.src !== window.location.href;
						if (!hasValidAudio) {
							restorePlayback(data.length);
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
						this.isPlaylistLoaded = true;
						try {
							localStorage.setItem(cKey, JSON.stringify(data));
						} catch (e) {}
						const hasValidAudio = this.audio && this.audio.src && this.audio.src !== "" && this.audio.src !== window.location.href;
						if (!hasValidAudio) {
							restorePlayback(data.length);
						}
						this.notify();
					}
				}
			} catch (e) {
				console.warn("Failed to fetch playlist from Meting API", e);
			}
		},
	};

	audio.addEventListener("timeupdate", () => {
		manager.currentTime = audio.currentTime;
		manager.duration = audio.duration || 0;

		if (manager.parsedLyrics.length > 0) {
			let activeIdx = -1;
			for (let i = 0; i < manager.parsedLyrics.length; i++) {
				if (manager.currentTime >= manager.parsedLyrics[i].time) {
					activeIdx = i;
				} else {
					break;
				}
			}
			if (activeIdx !== manager.currentLyricIndex) {
				manager.currentLyricIndex = activeIdx;
				manager.currentLyricText = activeIdx >= 0 ? manager.parsedLyrics[activeIdx].text : "";
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
		if (manager.pendingSeekTime !== undefined && manager.pendingSeekTime > 0) {
			audio.currentTime = manager.pendingSeekTime;
			manager.currentTime = manager.pendingSeekTime;
			manager.pendingSeekTime = undefined;
		}
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

	setGlobalMusicManager(manager);
	return manager;
}

let syncCallback: () => void;

function markUserInteraction() {
	isUserInteracting = true;
	if (userScrollTimeout) clearTimeout(userScrollTimeout);
	userScrollTimeout = setTimeout(() => {
		isUserInteracting = false;
		scrollToActiveLyric(true);
	}, 2600);
}

function scrollToActiveLyric(smooth = true) {
	if (!lyricsScrollEl || isUserInteracting || currentLyricIndex < 0) return;
	const activeEl = lyricsScrollEl.querySelector(`[data-lyric-idx="${currentLyricIndex}"]`) as HTMLElement;
	if (!activeEl) return;

	const targetTop = activeEl.offsetTop - (lyricsScrollEl.clientHeight / 2) + (activeEl.clientHeight / 2);
	lyricsScrollEl.scrollTo({
		top: Math.max(0, targetTop),
		behavior: smooth ? "smooth" : "auto",
	});
}

function handleLyricsScroll() {
	if (!lyricsScrollEl) return;
	const { scrollTop, scrollHeight, clientHeight } = lyricsScrollEl;
	const maxScroll = scrollHeight - clientHeight;
	if (maxScroll <= 0) {
		thumbTop = 0;
		thumbHeight = 100;
		return;
	}
	const heightPercent = Math.max(20, Math.min(65, (clientHeight / scrollHeight) * 100));
	thumbHeight = heightPercent;
	const scrollRatio = scrollTop / maxScroll;
	thumbTop = scrollRatio * (100 - thumbHeight);
}

function handleScrollUp() {
	markUserInteraction();
	if (lyricsScrollEl) {
		lyricsScrollEl.scrollBy({ top: -45, behavior: "smooth" });
	}
}

function handleScrollDown() {
	markUserInteraction();
	if (lyricsScrollEl) {
		lyricsScrollEl.scrollBy({ top: 45, behavior: "smooth" });
	}
}

function handleTrackClick(e: MouseEvent) {
	if (!trackEl || !lyricsScrollEl || isDraggingThumb) return;
	const rect = trackEl.getBoundingClientRect();
	const clickRatio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
	const maxScroll = lyricsScrollEl.scrollHeight - lyricsScrollEl.clientHeight;
	lyricsScrollEl.scrollTo({
		top: clickRatio * maxScroll,
		behavior: "smooth",
	});
	markUserInteraction();
}

function handleThumbMouseDown(e: MouseEvent) {
	e.stopPropagation();
	e.preventDefault();
	isDraggingThumb = true;
	startDragY = e.clientY;
	if (lyricsScrollEl) {
		startDragScrollTop = lyricsScrollEl.scrollTop;
	}
	markUserInteraction();

	const onMouseMove = (moveEvent: MouseEvent) => {
		if (!isDraggingThumb || !lyricsScrollEl || !trackEl) return;
		const deltaY = moveEvent.clientY - startDragY;
		const trackHeight = trackEl.clientHeight;
		const maxScroll = lyricsScrollEl.scrollHeight - lyricsScrollEl.clientHeight;
		if (trackHeight <= 0 || maxScroll <= 0) return;

		const effectiveTrackHeight = trackHeight * (1 - thumbHeight / 100);
		const scrollDelta = (deltaY / effectiveTrackHeight) * maxScroll;
		lyricsScrollEl.scrollTop = Math.max(0, Math.min(maxScroll, startDragScrollTop + scrollDelta));
		markUserInteraction();
	};

	const onMouseUp = () => {
		isDraggingThumb = false;
		window.removeEventListener("mousemove", onMouseMove);
		window.removeEventListener("mouseup", onMouseUp);
	};

	window.addEventListener("mousemove", onMouseMove);
	window.addEventListener("mouseup", onMouseUp);
}

function handleLyricClick(time: number) {
	const mgr = getGlobalMusicManager();
	if (mgr) {
		mgr.seek(time);
		if (!mgr.isPlaying) {
			mgr.togglePlay();
		}
	}
	isUserInteracting = false;
	setTimeout(() => scrollToActiveLyric(true), 50);
}

$: if (currentLyricIndex !== undefined && showLyrics) {
	// 在当前歌词索引变化时自动居中
	setTimeout(() => {
		scrollToActiveLyric(true);
		handleLyricsScroll();
	}, 20);
}

onMount(() => {
	const mgr = getOrCreateGlobalManager();

	const syncState = () => {
		playlist = mgr.playlist;
		currentIndex = mgr.currentIndex;
		isPlaying = mgr.isPlaying;
		currentTime = mgr.currentTime;
		duration = mgr.duration;
		volume = mgr.volume;
		isMuted = mgr.isMuted;
		loopMode = mgr.loopMode;
		showLyrics = mgr.showLyrics ?? false;
		showPlaylist = mgr.showPlaylist ?? false;
		parsedLyrics = mgr.parsedLyrics || [];
		currentLyricText = mgr.currentLyricText || "";
		currentLyricIndex = mgr.currentLyricIndex ?? -1;
	};

	syncCallback = syncState;
	mgr.listeners.add(syncCallback);
	syncState();

	const isPlaylistLoaded = Array.isArray(mgr.playlist) && mgr.playlist.length > 0;
	if (!isPlaylistLoaded || !mgr.isPlaylistLoaded) {
		mgr.server = server;
		mgr.type = type;
		mgr.id = String(id);
		mgr.fetchPlaylist(server, type, String(id), autoPlay, CACHE_KEY);
	}

	setTimeout(() => {
		scrollToActiveLyric(false);
		handleLyricsScroll();
	}, 60);
});

onDestroy(() => {
	const mgr = getGlobalMusicManager();
	if (mgr && syncCallback) {
		mgr.listeners.delete(syncCallback);
	}
	if (userScrollTimeout) {
		clearTimeout(userScrollTimeout);
	}
});

function handlePlayToggle() {
	getGlobalMusicManager()?.togglePlay();
}

function handlePrev() {
	getGlobalMusicManager()?.prevSong();
}

function handleNext() {
	getGlobalMusicManager()?.nextSong();
}

function handleLoopToggle() {
	getGlobalMusicManager()?.toggleLoopMode();
}

function handleLyricsToggle() {
	getGlobalMusicManager()?.toggleLyrics();
	setTimeout(() => {
		scrollToActiveLyric(false);
		handleLyricsScroll();
	}, 60);
}

function handlePlaylistToggle() {
	getGlobalMusicManager()?.togglePlaylist();
}

function handleSeek(e: MouseEvent) {
	const mgr = getGlobalMusicManager();
	if (!mgr || !duration) return;
	const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
	const clickX = e.clientX - rect.left;
	const newTime = (clickX / rect.width) * duration;
	mgr.seek(newTime);
}

function handleVolumeChange(e: Event) {
	const target = e.target as HTMLInputElement;
	const val = parseFloat(target.value);
	getGlobalMusicManager()?.setVolume(val);
}

function handleMuteToggle() {
	getGlobalMusicManager()?.toggleMute();
}

function handleSelectSong(idx: number) {
	const mgr = getGlobalMusicManager();
	if (mgr) {
		mgr.consecutiveErrors = 0;
		mgr.loadSong(idx, true, true);
		mgr.showPlaylist = false;
		showPlaylist = false;
	}
}
</script>

<div class="card-base p-4 w-full select-none relative overflow-hidden transition-all duration-300">
    <!-- Header Title & Quick Action Icons (对齐图2橙色竖条与加粗标题) -->
    <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2 font-bold text-[16px] text-neutral-900 dark:text-neutral-100 tracking-wide">
            <span class="w-1.5 h-4.5 rounded-full bg-[var(--primary)] shrink-0 inline-block shadow-sm"></span>
            <span>{title}</span>
        </div>

        <div class="flex items-center gap-1 text-neutral-400 dark:text-neutral-500">
            <!-- Lyrics Toggle Button -->
            <button
                on:click={handleLyricsToggle}
                class="p-1.5 rounded-lg hover:text-[var(--primary)] hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center {showLyrics ? 'text-[var(--primary)]' : ''}"
                title={showLyrics ? "折叠歌词" : "展开歌词"}
            >
                <Icon icon="material-symbols:subtitles-rounded" class="text-lg" />
            </button>

            <!-- Volume Button with Flyout Slider -->
            <div class="relative flex items-center">
                <button
                    on:click={() => (showVolumeSlider = !showVolumeSlider)}
                    class="p-1.5 rounded-lg hover:text-[var(--primary)] hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center {showVolumeSlider ? 'text-[var(--primary)]' : ''}"
                    title="调节音量"
                >
                    <Icon icon={isMuted || volume === 0 ? "material-symbols:volume-off-rounded" : "material-symbols:volume-up-rounded"} class="text-lg" />
                </button>

                {#if showVolumeSlider}
                    <div class="absolute right-0 top-8 z-30 p-2.5 rounded-xl bg-[var(--float-panel-bg-opaque)] border border-black/10 dark:border-white/10 shadow-xl flex items-center gap-2 animate-fade-in backdrop-blur-md">
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

    <!-- Song Information Row (严格锁定52px高度与正圆唱片尺寸，彻底消除形变) -->
    <div class="flex items-center gap-3 my-1.5 h-[52px] w-full overflow-hidden">
        <!-- Rotating Vinyl Disc Cover (严格锁定正方形圆形比例，防止任何形变) -->
        <div class="relative w-[52px] h-[52px] min-w-[52px] min-h-[52px] max-w-[52px] max-h-[52px] aspect-square shrink-0 bg-neutral-900 rounded-full overflow-hidden shadow-md ring-1 ring-black/10 dark:ring-white/15 flex items-center justify-center">
            <img
                src={getOptimizedCover(currentSong.pic)}
                alt={currentSong.title}
                width="52"
                height="52"
                loading="eager"
                decoding="async"
                fetchpriority="high"
                class="w-full h-full object-cover rounded-full select-none pointer-events-none block {isPlaying ? 'animate-spin-slow' : ''}"
                on:error={(e) => {
                    const target = e.currentTarget;
                    if (target && target.src !== '/favicon/favicon.svg') {
                        target.src = '/favicon/favicon.svg';
                    }
                }}
            />
            <!-- Center Vinyl Spindle Hole -->
            <div class="absolute inset-0 m-auto w-3 h-3 min-w-[12px] min-h-[12px] rounded-full bg-neutral-900 border-2 border-neutral-700 pointer-events-none shadow-inner z-10"></div>
        </div>

        <!-- Song Title & Artist & Time/Volume Row (固定两端对齐与防折行) -->
        <div class="flex-1 min-w-0 h-full flex flex-col justify-between overflow-hidden py-0.5">
            <div class="flex items-center justify-between gap-1 w-full overflow-hidden leading-tight">
                <span class="font-bold text-[14px] leading-tight text-neutral-900 dark:text-neutral-100 truncate block flex-1" title={currentSong.title}>
                    {currentSong.title}
                </span>
                <button
                    on:click={handleLyricsToggle}
                    class="px-1.5 py-0.5 rounded text-[10px] font-mono border transition shrink-0 select-none {showLyrics ? 'text-white bg-[var(--primary)] border-[var(--primary)] shadow-sm' : 'text-[var(--primary)] border-[var(--primary)]/30 hover:bg-[var(--primary)]/10'}"
                    title={showLyrics ? "折叠歌词" : "展开歌词"}
                >
                    LRC
                </button>
            </div>
            <div class="text-[11.5px] text-neutral-500 dark:text-neutral-400 truncate block leading-tight" title={currentSong.author}>
                {currentSong.author}
            </div>
            <div class="flex items-center justify-between text-[10.5px] font-mono text-neutral-400 dark:text-neutral-500 tabular-nums leading-none">
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                <div class="flex items-center gap-1 text-neutral-400">
                    <Icon icon="material-symbols:volume-up-rounded" class="text-xs" />
                    <div class="w-10 h-1 bg-black/10 dark:bg-white/15 rounded-full overflow-hidden">
                        <div class="h-full bg-[var(--primary)] rounded-full" style="width: {isMuted ? 0 : volume * 100}%"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Interactive Progress Scrub Bar -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="w-full h-1.5 hover:h-2.5 bg-black/10 dark:bg-white/10 rounded-full cursor-pointer relative overflow-hidden transition-all my-2.5"
        on:click={handleSeek}
        title="点击跳转播放进度"
    >
        <div
            class="h-full bg-[var(--primary)] rounded-full transition-all duration-100 relative"
            style="width: {progressPercent}%"
        ></div>
    </div>

    <!-- Playback Control Bar (对齐中央饱满大按键) -->
    <div class="flex items-center justify-between px-1 text-neutral-600 dark:text-neutral-300 h-11">
        <!-- Loop Mode Button -->
        <button
            on:click={handleLoopToggle}
            class="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--primary)] transition"
            title={loopMode === 'order' ? '列表循环' : loopMode === 'single' ? '单曲循环' : '随机播放'}
        >
            {#if loopMode === "order"}
                <Icon icon="material-symbols:repeat-rounded" class="text-xl" />
            {:else if loopMode === "single"}
                <Icon icon="material-symbols:repeat-one-rounded" class="text-xl text-[var(--primary)]" />
            {:else}
                <Icon icon="material-symbols:shuffle-rounded" class="text-xl text-[var(--primary)]" />
            {/if}
        </button>

        <!-- Previous Song Button -->
        <button
            on:click={handlePrev}
            class="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--primary)] transition"
            title="上一曲"
        >
            <Icon icon="material-symbols:skip-previous-rounded" class="text-2xl" />
        </button>

        <!-- Master Play/Pause Large Circular Button (完全对标图2) -->
        <button
            on:click={handlePlayToggle}
            class="w-12 h-12 rounded-full bg-[var(--primary)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center text-white shadow-md shadow-[var(--primary)]/25"
            title={isPlaying ? "暂停" : "播放"}
        >
            <Icon icon={isPlaying ? "material-symbols:pause-rounded" : "material-symbols:play-arrow-rounded"} class="text-2xl translate-x-[0.5px]" />
        </button>

        <!-- Next Song Button -->
        <button
            on:click={handleNext}
            class="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--primary)] transition"
            title="下一曲"
        >
            <Icon icon="material-symbols:skip-next-rounded" class="text-2xl" />
        </button>

        <!-- Playlist Toggle Button -->
        <button
            on:click={handlePlaylistToggle}
            class="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 {showPlaylist ? 'text-[var(--primary)] bg-black/5 dark:bg-white/10' : ''} transition"
            title="播放列表"
        >
            <Icon icon="material-symbols:queue-music-rounded" class="text-xl" />
        </button>
    </div>

    <!-- Playlist Drawer (Accordion Dropdown) -->
    {#if showPlaylist}
        <div class="music-playlist-scrollbar mt-3 pt-2.5 border-t border-black/10 dark:border-white/10 max-h-48 overflow-y-auto overflow-x-hidden space-y-0.5 text-xs animate-fade-in w-full">
            {#each playlist as song, idx}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    on:click={() => handleSelectSong(idx)}
                    class="flex items-center justify-between p-2 rounded-lg cursor-pointer transition w-full overflow-hidden {idx === currentIndex ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'}"
                >
                    <div class="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span class="w-4 text-center text-[10px] text-neutral-400 shrink-0">{idx + 1}</span>
                        <span class="truncate block flex-1" title={song.title}>{song.title}</span>
                    </div>
                    <span class="text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0 truncate max-w-[38%] text-right" title={song.author}>{song.author}</span>
                </div>
            {/each}
        </div>
    {/if}

    <!-- Scrolling Lyrics Window with Custom Scrollbar (完全对标图2精美滚动与滚动条) -->
    {#if showLyrics}
        <div class="lyrics-card-box relative w-full flex items-stretch mt-3 rounded-2xl overflow-hidden bg-black/[0.02] dark:bg-black/25 border border-black/5 dark:border-white/5 shadow-inner transition-all">
            <!-- Lyrics Scrollable Area -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                bind:this={lyricsScrollEl}
                on:scroll={handleLyricsScroll}
                on:wheel={markUserInteraction}
                on:touchstart={markUserInteraction}
                class="lyrics-scroll-area flex-1 h-[175px] overflow-y-auto px-4 py-10 text-center relative scroll-smooth"
            >
                {#if parsedLyrics.length > 0}
                    <div class="space-y-4">
                        {#each parsedLyrics as lyric, idx}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <div
                                data-lyric-idx={idx}
                                on:click={() => handleLyricClick(lyric.time)}
                                class="lyric-item cursor-pointer transition-all duration-300 transform select-none {idx === currentLyricIndex ? 'lyric-item-active text-[var(--primary)] font-bold scale-[1.03] opacity-100 drop-shadow-sm' : 'text-neutral-500 dark:text-neutral-400 font-medium text-[13px] opacity-45 hover:opacity-85 scale-100'}"
                            >
                                <div class="leading-relaxed {idx === currentLyricIndex ? 'text-[14.5px] md:text-[15px] font-bold' : ''}">
                                    {lyric.text}
                                </div>
                                {#if lyric.translation}
                                    <div class="text-[12px] mt-0.5 tracking-wide {idx === currentLyricIndex ? 'text-[var(--primary)]/90 font-medium' : 'opacity-70 font-normal'}">
                                        {lyric.translation}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="h-full flex flex-col items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 py-10 gap-1.5">
                        <Icon icon="material-symbols:music-note-rounded" class="text-xl opacity-40 text-[var(--primary)]" />
                        <span>{currentSong.url ? "暂无歌词或纯音乐，请欣赏" : "歌词加载中..."}</span>
                    </div>
                {/if}
            </div>

            <!-- Custom 精美滚动条 (对标图2：顶部▲箭头 + 药丸胶囊滑块 + 底部▼箭头) -->
            {#if parsedLyrics.length > 0}
                <div class="w-4.5 shrink-0 flex flex-col items-center justify-between py-1.5 select-none bg-black/[0.03] dark:bg-white/[0.02] border-l border-black/5 dark:border-white/5">
                    <!-- Top Caret Button ▲ -->
                    <button
                        on:click={handleScrollUp}
                        class="w-3.5 h-3.5 flex items-center justify-center text-neutral-400 hover:text-[var(--primary)] active:scale-90 transition rounded"
                        title="向上翻阅歌词"
                    >
                        <Icon icon="material-symbols:arrow-drop-up-rounded" class="text-base -my-1" />
                    </button>

                    <!-- Scroll Track & Pill Thumb -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        bind:this={trackEl}
                        on:click={handleTrackClick}
                        class="w-full flex-1 relative my-0.5 cursor-pointer flex justify-center"
                    >
                        <div
                            on:mousedown={handleThumbMouseDown}
                            class="absolute w-1.5 rounded-full bg-neutral-400/50 hover:bg-[var(--primary)] dark:bg-neutral-500/50 dark:hover:bg-[var(--primary)] transition-[background-color,transform] cursor-grab active:cursor-grabbing shadow-sm"
                            style="top: {thumbTop}%; height: {thumbHeight}%;"
                        ></div>
                    </div>

                    <!-- Bottom Caret Button ▼ -->
                    <button
                        on:click={handleScrollDown}
                        class="w-3.5 h-3.5 flex items-center justify-center text-neutral-400 hover:text-[var(--primary)] active:scale-90 transition rounded"
                        title="向下翻阅歌词"
                    >
                        <Icon icon="material-symbols:arrow-drop-down-rounded" class="text-base -my-1" />
                    </button>
                </div>
            {/if}
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

/* 歌词视窗上下柔和边缘淡出遮罩（Gradient Fade Mask） */
.lyrics-scroll-area {
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(0, 0, 0, 0.35) 8%,
        black 22%,
        black 78%,
        rgba(0, 0, 0, 0.35) 92%,
        transparent 100%
    );
    mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(0, 0, 0, 0.35) 8%,
        black 22%,
        black 78%,
        rgba(0, 0, 0, 0.35) 92%,
        transparent 100%
    );
}
.lyrics-scroll-area::-webkit-scrollbar {
    display: none;
}

.lyric-item {
    will-change: transform, opacity, color;
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

