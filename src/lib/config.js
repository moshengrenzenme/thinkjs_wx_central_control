/*
* 微信中控域名地址
*   微信公众号接口配置使用；
*   业务系统调用使用；
* */
export const CENTRAL_CONTROL_SERVE_URL = 'https://1848affa.ngrok.io';

/*
* 数据库相关
* */
export const MODEL = {
    CONFIG: { // 配置相关
        host: '127.0.0.1',
        port: '3306',
        database: 'wx_center_control',
        user: 'root',
        password: '',
        charset: 'utf8mb4',
    },
    TABLE: { // 数据库表
        OFFICIAL: 'official', // 公众号
        OFFICIAL_USER: 'official_user', // 公众号_用户
    }
};

/*
* 在think-wechat中间件插件配置处使用 => src/config/middleware/
* */
export const WECHAT_DEVELOPER_ROUTE = '/serve';

/*
* 在think-wechat中间件插件配置处使用 => src/config/middleware/
* */
export const WECHAT_DEVELOPER_TOKEN = 'zyq';

/*
* 对接的小程序列表
* */
export const WECHAT_MINI_PROGRAM_LIST = []