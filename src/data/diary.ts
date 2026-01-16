// 日记数据配置
// 用于管理日记页面的数据

export interface DiaryItem {
    id: number;
    content: string;
    date: string;
    images?: string[];
    location?: string;
    mood?: string;
    tags?: string[];
}

// 示例日记数据
const diaryData: DiaryItem[] = [
    {
        id: 1,
        content: "樱花飘落的速度是每秒五厘米！",
        date: "2025-01-15T10:30:00Z",
        images: ["https://pixport.072199.xyz/images/2026/01/16/e2f7b47cbd3efc09870b6581ddcf2ac7bd1459318843f3da02ab8b4b004912b9.webp"],
    },
    {
        id: 2,
        content: "今天的天气很好，适合出去走走。",
        date: "2025-01-14T15:00:00Z",
        mood: "😊",
        tags: ["日常", "心情"],
    },
];

// 获取日记统计数据
export const getDiaryStats = () => {
    const total = diaryData.length;
    const hasImages = diaryData.filter(
        (item) => item.images && item.images.length > 0,
    ).length;
    const hasLocation = diaryData.filter((item) => item.location).length;
    const hasMood = diaryData.filter((item) => item.mood).length;

    return {
        total,
        hasImages,
        hasLocation,
        hasMood,
    };
};

// 获取日记列表（按时间倒序）
export const getDiaryList = (limit?: number) => {
    const sortedData = diaryData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    if (limit && limit > 0) {
        return sortedData.slice(0, limit);
    }

    return sortedData;
};

// 获取最新的日记
export const getLatestDiary = () => {
    return getDiaryList(1)[0];
};

// 根据 ID 获取日记
export const getDiaryById = (id: number) => {
    return diaryData.find((item) => item.id === id);
};

export default diaryData;
