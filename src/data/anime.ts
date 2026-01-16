// 本地番剧数据配置
export type AnimeItem = {
    title: string;
    status: "watching" | "completed" | "planned" | "onhold" | "dropped";
    rating: number;
    cover: string;
    description: string;
    episodes: string;
    year: string;
    genre: string[];
    studio: string;
    link: string;
    progress: number;
    totalEpisodes: number;
    startDate: string;
    endDate: string;
};

// 示例番剧数据
const localAnimeList: AnimeItem[] = [
    {
        title: "莉可丽丝",
        status: "completed",
        rating: 9.8,
        cover: "/images/anime/default.webp",
        description: "少女与枪火的故事",
        episodes: "12 集",
        year: "2022",
        genre: ["动作", "日常"],
        studio: "A-1 Pictures",
        link: "https://www.bilibili.com/bangumi/media/md28338623",
        progress: 12,
        totalEpisodes: 12,
        startDate: "2022-07",
        endDate: "2022-09",
    },
    {
        title: "若能与你共乘海浪之上",
        status: "watching",
        rating: 9.5,
        cover: "/images/anime/default.webp",
        description: "少女的日常，甜蜜治愈",
        episodes: "12 集",
        year: "2015",
        genre: ["日常", "治愈"],
        studio: "Nexus",
        link: "https://www.bilibili.com/bangumi/media/md2590",
        progress: 8,
        totalEpisodes: 12,
        startDate: "2015-07",
        endDate: "2015-09",
    },
    {
        title: "恋爱小行星",
        status: "planned",
        rating: 9.2,
        cover: "/images/anime/default.webp",
        description: "在星星之间邂逅少女，纯爱治愈",
        episodes: "12 集",
        year: "2020",
        genre: ["恋爱", "治愈"],
        studio: "Doga Kobo",
        link: "https://www.bilibili.com/bangumi/media/md28224128",
        progress: 0,
        totalEpisodes: 12,
        startDate: "2020-01",
        endDate: "2020-03",
    },
];

export default localAnimeList;
