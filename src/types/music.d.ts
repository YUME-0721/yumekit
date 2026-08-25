export interface Song {
	title: string;
	author: string;
	url: string;
	pic: string;
	lrc?: string;
}

export interface ParsedLyric {
	time: number;
	text: string;
}

export interface MusicManager {
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
	pendingSeekTime?: number;
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
