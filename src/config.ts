import type {
	ExpressiveCodeConfig,
	GitHubEditConfig,
	ImageFallbackConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
	UmamiConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "放课后の技术部",
	subtitle: "",
	description:
		"分享网络技术、服务器部署、内网穿透、静态网站搭建、CDN优化、容器化部署等技术教程与实践经验的个人技术博客，专注于云原生、无服务器架构和前后端开发，作者为YUME",

	keywords: [],
	lang: "zh_CN", // 'en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'es', 'th'
	themeColor: {
		hue: 345, // 主题颜色的默认色调，范围在 0 到 360 度之间。例如：红色：0 度，青绿色：200 度，青色：250 度，粉色：345 度。
		fixed: false, // 隐藏访客端的主题颜色选择器
		forceDarkMode: false, // 强制启用暗黑模式并隐藏主题切换器
	},
	banner: {
		enable: false,
		src: "/xinghui.avif", // 相对于“/src”目录。如果位于“/public”目录的起始位置，则相对于“/public”目录。

		position: "center", // 与对象位置设置相同，仅支持“顶部”、“居中”、“底部”选项。默认情况下为“居中”。
		credit: {
			enable: true, // 显示横幅图片的信用说明文字
			text: "Pixiv @chokei", // 需显示的版权声明

			url: "https://www.pixiv.net/artworks/122782209", // （可选）指向原始作品或艺术家页面的网址链接
		},
	},
	background: {
		enable: true, // 启用背景图片
		src: "https://pic.yumekai.top/pic?img=ua", // 背景图片 URL（支持 HTTPS）
		position: "center", // 背景位置：'top'（顶部）、'center'（居中）、'bottom'（底部）
		size: "cover", // 背景尺寸：'cover'（覆盖）、'contain'（包含）、'auto'（自动）
		repeat: "no-repeat", // 背景重复：'no-repeat'（不重复）、'repeat'（重复）、'repeat-x'（水平重复）、'repeat-y'（垂直重复）
		attachment: "fixed", // 背景附件：'fixed'（固定）、'scroll'（滚动）、'local'（本地）
		opacity: 1, // 背景不透明度（0-1）
	},
	toc: {
		enable: true, // 在文章右侧显示目录
		depth: 2, // 显示目录的最大标题深度，从 1 到 3
	},
	showCoverInContent: false, // 是否在文章正文中显示封面图片（true: 显示，false: 不显示）
	favicon: [
		// 将此数组留空，即可使用默认的网站图标。
		{
			src: "/favicon/favicon.svg", // 网站图标的路径，相对于“/public”目录
			//   theme: 'light',              // （可选）“light”或“dark”，仅在有不同亮暗模式的网站图标时设置
			//   sizes: '32x32',              // （可选）网站图标的大小，仅在有不同尺寸的网站图标时设置
		},
	],
	officialSites: [
		{ url: "https://blog.yumekai.top", alias: "CN" },
		{ url: "https://blog.072199.xyz", alias: "Global" },
	],
	server: [
		{ url: "", text: "博客本体节点" },
		{ url: "https://pic.yumekai.top", text: "随机图节点" }
		// { url: "https://cfstatus.072199.xyz", text: "状态检测节点" }
	],

	// 功能页面开关配置
	featurePages: {
		anime: true, // 番剧页面开关
	},

	// Bangumi 配置
	bangumi: {
		userId: "1015457", // 在此处设置你的 Bangumi 用户 ID
	},

	// 番剧页面配置
	anime: {
		mode: "bangumi", // 番剧页面模式："bangumi" 使用 Bangumi API，"local" 使用本地配置
	},
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		{
			name: "文章",
			url: "#",
			children: [
				{
					name: "文章列表",
					url: "/posts/",
					icon: "material-symbols:list-alt-rounded",
				},
				LinkPreset.Archive,
			],
		},
		{
			name: "我的",
			url: "#",
			children: [
				{
					name: "番剧",
					url: "/anime/",
					icon: "material-symbols:movie",
				},
			],
		},
		{
			name: "网站",
			url: "#",
			children: [
				{
					name: "统计",
					url: "https://umami.yumekai.top/share/46vKiUC2hTE5PytG",
					icon: "material-symbols:bar-chart-rounded",
					external: true,
				},
				{
					name: "画廊",
					url: "https://img.072199.xyz/browse/wallpaper",
					icon: "material-symbols:photo-library-rounded",
					external: true,
				},
			],
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "/avatar.gif", // 使用本地预压缩的动态 WebP (394KB)，秒级极速加载
	name: "YUME",
	bio: "Ciallo～(∠・ω< )⌒",
	links: [
		{
			name: "Bilibli",
			icon: "fa6-brands:bilibili",
			url: "https://space.bilibili.com/523354432",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/YUME-0721",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const imageFallbackConfig: ImageFallbackConfig = {
	enable: false,
	originalDomain: "https://pixport.072199.xyz/image_api.php?return=redirect",
	fallbackDomain: "https://pixport.072199.xyz/image_api.php?return=redirect",
};

export const umamiConfig: UmamiConfig = {
	enabled: true, // 是否显示 Umami 统计
	baseUrl: "https://umami.yumekai.top", // 自建 Umami 服务地址
	websiteId: "967adb81-bb8b-429d-855d-2ac915a6af96", // Umami 网站 ID
	shareId: "46vKiUC2hTE5PytG", // Umami 分享 ID
	scripts: `
<script defer src="https://umami.yumekai.top/script.js" data-website-id="967adb81-bb8b-429d-855d-2ac915a6af96"></script>
  `.trim(), // 上面填你要插入的 Script，不用再去 Layout 中插入
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	theme: "github-dark",
	//"github-light" - GitHub 浅色
	// 	"github-dark" - GitHub 深色（当前）
	// "dracula" - Dracula 主题
	// "one-dark-pro" - One Dark Pro
	// "material-theme-darker" - Material 深色
	// "vitesse-dark" / "vitesse-light" - Vitesse 主题
};

export const gitHubEditConfig: GitHubEditConfig = {
	enable: true,
	baseUrl: "https://github.com/YUME-0721/yumekit/tree/main/src/content/posts",
};

// “todoConfig”已从此处移除
