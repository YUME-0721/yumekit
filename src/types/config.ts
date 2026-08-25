import type { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants";

// 功能页面开关配置
export type FeaturePages = {
	anime: boolean; // 番剧页面开关
};

// Bangumi 配置
export type BangumiConfig = {
	userId?: string; // Bangumi 用户 ID
};

// 番剧页面配置
export type AnimeConfig = {
	mode?: "bangumi" | "local"; // 番剧页面模式
};

// 网页桌宠配置
export type PetConfig = {
	enable: boolean; // 是否启用网页桌宠组件
};

// 公告栏配置
export type AnnouncementConfig = {
	enable: boolean; // 是否启用公告栏
	title?: string; // 公告栏标题
	content: string; // 公告内容（支持 HTML/文本）
};

// 音乐播放器配置
export type MusicConfig = {
	enable: boolean; // 是否启用音乐播放器
	title?: string; // 音乐卡片标题
	server?: "netease" | "tencent" | "kugou" | "xiami" | "baidu"; // 音频平台服务商
	type?: "playlist" | "song" | "album" | "artist"; // 类型：歌单/单曲/专辑/艺术家
	id?: string; // 歌单/歌曲 ID
	autoPlay?: boolean; // 是否自动播放
	volume?: number; // 默认音量 (0~1)
};

export type SiteConfig = {
	title: string;
	subtitle: string;
	description?: string;
	keywords?: string[];

	lang: string;

	themeColor: {
		hue: number;
		fixed: boolean;
		forceDarkMode?: boolean;
	};
	banner: {
		enable: boolean;
		src: string;
		position?: "top" | "center" | "bottom";
		credit: {
			enable: boolean;
			text: string;
			url?: string;
		};
	};
	background: {
		enable: boolean;
		src: string;
		position?: "top" | "center" | "bottom";
		size?: "cover" | "contain" | "auto";
		repeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
		attachment?: "fixed" | "scroll" | "local";
		opacity?: number;
	};
	toc: {
		enable: boolean;
		depth: 1 | 2 | 3;
	};

	showCoverInContent: false; // 是否在文章正文中显示封面图片（true: 显示，false: 不显示）

	favicon: Favicon[];
	officialSites?: (string | { url: string; alias: string })[];
	server?: {
		url: string;
		text: string;
	}[];

	// 功能页面开关配置
	featurePages?: FeaturePages;
	// Bangumi 配置
	bangumi?: BangumiConfig;
	// 番剧页面配置
	anime?: AnimeConfig;
	// 网页桌宠配置
	pet?: PetConfig;
	// 公告栏配置
	announcement?: AnnouncementConfig;
	// 音乐播放器配置
	music?: MusicConfig;
};

export type Favicon = {
	src: string;
	theme?: "light" | "dark";
	sizes?: string;
};

export enum LinkPreset {
	Home = 0,
	Archive = 1,
	Anime = 2,
}

export type NavBarLink = {
	name: string;
	url: string;
	external?: boolean;
	icon?: string; // 菜单项图标
	children?: (NavBarLink | LinkPreset)[]; // 支持子菜单
};

export type NavBarConfig = {
	links: (NavBarLink | LinkPreset)[];
};

export type ProfileConfig = {
	avatar?: string;
	name: string;
	bio?: string;
	links: {
		name: string;
		url: string;
		icon: string;
	}[];
};

export type LicenseConfig = {
	enable: boolean;
	name: string;
	url: string;
};

export type ImageFallbackConfig = {
	enable: boolean;
	originalDomain: string;
	fallbackDomain: string;
};

export type UmamiConfig = {
	enabled: boolean;
	baseUrl: string;
	websiteId: string;
	shareId?: string;
	scripts: string;
};

export type LIGHT_DARK_MODE =
	| typeof LIGHT_MODE
	| typeof DARK_MODE
	| typeof AUTO_MODE;

export type BlogPostData = {
	body: string;
	title: string;
	published: Date;
	description: string;
	tags: string[];
	category?: string;
	draft?: boolean;
	image?: string;
	prevTitle?: string;
	prevSlug?: string;
	nextTitle?: string;
	nextSlug?: string;
};

export type ExpressiveCodeConfig = {
	theme: string;
};

export type GitHubEditConfig = {
	enable: boolean;
	baseUrl: string;
};

