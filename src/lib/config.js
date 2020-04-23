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
        ADMIN_USER: 'admin_user', // 管理员_用户
        ADMIN_USER_ROLE: 'admin_user_role', // 管理员_用户_角色
        ADMIN_ROLE: 'admin_role', // 管理员_角色
        ADMIN_ROLE_AUTH: 'admin_role_auth', // 管理员_角色_权限
        ADMIN_AUTH: 'admin_auth', // 管理员_权限
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
export const WECHAT_MINI_PROGRAM_LIST = [];

/*
* 管理员登录session名称
* */
export const ADMIN_LOGIN_SESSION_NAME = 'admin';

/*
* 后台管理系统不校验登录权限的接口
* */
export const ADMIN_API_NOT_AUTH = ['/admin/user/login'];