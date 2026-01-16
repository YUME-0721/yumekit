import { LinkPreset, type NavBarLink } from "@/types/config";

export const LinkPresets: { [key in LinkPreset]: NavBarLink } = {
	[LinkPreset.Home]: {
		name: "首页",
		url: "/",
	},
	[LinkPreset.Archive]: {
		name: "归档",
		url: "/archive/",
	},
	[LinkPreset.Anime]: {
		name: "番剧",
		url: "/anime/",
		icon: "material-symbols:movie",
	},
	[LinkPreset.Diary]: {
		name: "日记",
		url: "/diary/",
		icon: "material-symbols:book-2",
	},
	[LinkPreset.Albums]: {
		name: "相册",
		url: "/albums/",
		icon: "material-symbols:photo-library",
	},
	[LinkPreset.Devices]: {
		name: "设备",
		url: "/devices/",
		icon: "material-symbols:devices",
	},
};
