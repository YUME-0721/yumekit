// 相册类型定义

// 单张照片类型
export interface Photo {
    id: string;
    src: string;
    thumbnail?: string;
    alt?: string;
    title?: string;
    description?: string;
    tags?: string[];
    date?: string;
    location?: string;
    width?: number;
    height?: number;
}

// 相册组类型
export interface AlbumGroup {
    id: string;
    title: string;
    description?: string;
    cover: string;
    date: string;
    location?: string;
    tags?: string[];
    layout?: "grid" | "masonry" | "carousel";
    columns?: number;
    photos: Photo[];
    hidden?: boolean;
}
