// 设备数据配置文件

export interface Device {
    name: string;
    image: string;
    specs: string;
    description: string;
    link: string;
}

// 设备类别类型，支持品牌和自定义类别
export type DeviceCategory = {
    [categoryName: string]: Device[];
};

// 示例设备数据
export const devicesData: DeviceCategory = {
    手机: [
        {
            name: "小米 13",
            image: "https://cdn.cnbj0.fds.api.mi-img.com/b2c-shopapi-pms/pms_1670745529.40767182.png",
            specs: "远山蓝 / 12G + 256G",
            description: "小屏旗舰，徕卡专业光学镜头",
            link: "https://www.mi.com/xiaomi-13",
        },
    ],
};
