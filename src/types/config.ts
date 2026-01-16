import type { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants";

// 功能页面开关配置
export type FeaturePages = {
	anime: boolean; // 番剧页面开关
	diary: boolean; // 日记页面开关
	albums: boolean; // 相册页面开关
	devices: boolean; // 设备页面开关
};

// Bangumi 配置
export type BangumiConfig = {
	userId?: string; // Bangumi 用户 ID
};

// 番剧页面配置
export type AnimeConfig = {
	mode?: "bangumi" | "local"; // 番剧页面模式
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
	Diary = 3,
	Albums = 4,
	Devices = 5,
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
	apiKey: string;
	baseUrl: string;
	websiteId: string;
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

