# ThinkJS搭建微信中控服务

> 由于公司有对接**多个公众号**，和**微信支付**的业务需求，所以自建了这个可以对接微信相关功能的**微服务**；
>
> 框架选择了360奇舞团的**thinkjs**（仿佛目前还没有很多人使用😂）...
>
> 对接微信公众平台接口，使用了基于thinkjs的插件**think-wechat**
>
> 其余的就是对外（例如自己的业务服务）提供的接口，比如获取access_token、微信鉴权登录之类的。
>
> 支持多个公众号同时对接。



## ThinkJS

> ThinkJS 是一款面向未来开发的 Node.js 框架，整合了大量的项目最佳实践，让企业级开发变得更简单、高效。从 3.0 开始，框架底层基于 Koa 2.x 实现，兼容 Koa 的所有功能。

- 官网：https://thinkjs.org/

- v3.0文档：https://thinkjs.org/zh-cn/doc/3.0/index.html



## 当前实现接口

- 微信鉴权登录（鉴权全过程由中控自己完成）
- 前端获取sdk配置信息（自定义分享等功能使用）
- 获取access_token
- 获取微信用户信息
- 批量发送客服消息 - 文字
- 批量发送客服消息 - 语音
- 批量发送客服消息 - 图片
- 批量发送客服消息 - 音乐
- 批量发送客服消息 - 图文
- 获取已添加模版消息列表
- 批量发送模版消息
- 删除模版
- 生成参数二维码
- 生成短链接
- 接收微信服务器推送信息
  - 接收文字消息
  - 接收事件消息
    - 关注
    - 取消关注
    - 已关注扫码
    - 地理位置
    - 自定义菜单点击
    - 自定义菜单跳转
    - 模版消息发送完毕
  - 接收图片消息
  - 接收语音消息

## 数据库

### official

> 公众号配置表

```mysql
create table official
(
    id     int auto_increment comment '主键'
        primary key,
    name   varchar(255) null comment '公众号名称',
    `desc` varchar(255) null comment '公众号说明',
    appid  varchar(255) null comment '公众号appid',
    secret varchar(255) null comment '公众号secret'
)
    comment '公众号';
```

### official_user

> 公众号用户表

```mysql
create table official_user
(
    id             int auto_increment comment '主键'
        primary key,
    official_id    int          not null comment '公众号id',
    nickname       varchar(255) null comment '昵称',
    sex            int          null comment '性别',
    language       varchar(255) null comment '语言',
    subscribe      int          null comment '是否关注',
    province       varchar(255) null comment '省份',
    country        varchar(255) null comment '国家',
    headimgurl     longtext     null comment '头像',
    subscribe_time double       null comment '关注时间',
    openid         varchar(255) null comment '用户id',
    remark         varchar(255) null comment '备注',
    groupid        varchar(255) null comment '分组id',
    city           varchar(255) null comment '城市',
    unionid        varchar(255) null comment '开放平台id'
)
    comment '公众号_用户';
```

### admin_user

> 管理员用户表

```mysql
create table admin_user
(
    id       int auto_increment comment '主键'
        primary key,
    username varchar(255) null comment '用户名',
    password varchar(255) null comment '密码',
    nickname varchar(255) null comment '昵称',
    phone    double       null comment '电话号码'
)
    comment '管理员用户表';
```

### admin_role

> 管理员角色表

```mysql
create table admin_role
(
    id   int auto_increment comment '主键'
        primary key,
    name varchar(255) null comment '名称'
)
    comment '管理员角色表';
```

### admin_user_role

> 管理员用户角色关联表

```mysql
create table admin_user_role
(
    id      int auto_increment comment '主键'
        primary key,
    user_id int not null comment '管理员用户id',
    role_id int not null comment '管理员角色id'
)
    comment '管理员用户角色关联表';
```

### admin_auth

> 管理员权限表

```mysql
create table admin_auth
(
    id         int auto_increment comment '主键'
        primary key,
    name       varchar(255)   not null comment '权限名称',
    group_name varchar(255)   null comment '分组名称',
    parent_id  int default -1 not null comment '父级id',
    sort       int default 0  not null comment '排序',
    type       int            not null comment '权限类型(1:路由；2:接口；3:菜单)',
    router     varchar(255)   null comment '路由'
)
    comment '管理员权限表';
```

### admin_role_auth

> 管理员角色权限关联表

```mysql
create table admin_role_auth
(
    id      int auto_increment comment '主键'
        primary key,
    role_id int not null comment '角色id',
    auth_id int not null comment '权限id'
)
    comment '管理员角色权限关联表';
```

## 开发测试

### 1、申请微信测试号

1. 地址：https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login

2. 于是就有了appID和appsecret；
3. 将appID和appsecret填到`/src/lib/config.js`中对应的位置，id自己指定；

### 2、使用ngrok进行内网穿透

> 由于微信公众号接口配置需要有一个外网url，所以我们要进行内网穿透，ngrok很简单而且免费。

1. 使用说明：https://www.jianshu.com/p/53c72ae1446c

2. thinkjs默认的启动端口是8360，所以这里映射8360端口

   ```python
   $ /Users/..../Desktop/ngrok http 8360
   ```

3. 启动后会显示外网域名

   ```javascript
   ngrok by @inconshreveable                                       (Ctrl+C to quit)
                                                                                   
   Session Status                online                                            
   Session Expires               7 hours, 59 minutes                               
   Version                       2.3.35                                            
   Region                        United States (us)                                
   Web Interface                 http://127.0.0.1:4040                             
   Forwarding                    http://0c8e16a2.ngrok.io -> http://localhost:8360 
   Forwarding                    https://0c8e16a2.ngrok.io -> http://localhost:8360
                                                                                   
   Connections                   ttl     opn     rt1     rt5     p50     p90       
                                 0       0       0.00    0.00    0.00    0.00  
   ```

4. 将外网域名填到`/src/lib/config.js`中`CENTRAL_CONTROL_SERVE_URL`处

5. 将外网域名填到微信测试号页面的接口配置处

   >   http://0c8e16a2.ngrok.io/serve?id=0
   >
   > 这里的`id`和`/src/lib/config.js`文件里面的公众号列表对应的测试号id一致；
   >
   > 这里的`/serve`和`/src/lib/config.js`文件里面的`WECHAT_DEVELOPER_ROUTE`一致
   >
   > 起一个token名字填到接口配置处，和配置文件`WECHAT_DEVELOPER_TOKEN`处

### 3、安装依赖，启动服务

```python
# 安装依赖
npm install
# 启动服务
npm run start
```

1. 调用获取access_token接口：`http://0c8e16a2.ngrok.io/wxopen/get_access_token?id=0`
2. 其他接口同理....



## 核心文件

### /src/lib/config.js

> 一些供四处调用的配置信息。

```javascript
// 微信中控生产环境域名地址
export const CENTRAL_CONTROL_SERVE_URL = '';

// 数据库相关
export const MODEL = {}

// 在think-wechat中间件插件配置处使用 => src/config/middleware/
export const WECHAT_DEVELOPER_ROUTE = '/serve';
export const WECHAT_DEVELOPER_TOKEN = '';

// ......
```

### /src/lib/utils.js

> 一些工具方法

```javascript
const sha1 = require('sha1');
export const getTimestamp = () => parseInt(Date.now() / 1000);
export const getNonceStr = () => Math.random().toString(36).substr(2, 15);
export const getSignature = (params) => sha1(Object.keys(params).sort().map(key => `${key.toLowerCase()}=${params[key]}`).join('&'));
//......
```

### /src/config/adapter.js

> 在这里修改数据库配置信息

```javascript
import {MODEL} from "../lib/config";

exports.model = {
    type: 'mysql',
    common: {logConnect: isDev, logSql: isDev, logger: msg => think.logger.info(msg)},
    mysql: Object.assign({handle: mysql, prefix: '', dateStrings: true}, MODEL.CONFIG)
};
```

### /src/config/middleware.js

> ThinkJS中间件配置，在这里引入了插件**think-wechat**

```javascript
const wechat = require('think-wechat');
import {WECHAT_DEVELOPER_ROUTE, WECHAT_DEVELOPER_TOKEN} from "../lib/config";

module.exports = [
    {
        handle: wechat,
        match: WECHAT_DEVELOPER_ROUTE,
        options: {
            token: WECHAT_DEVELOPER_TOKEN,
            checkSignature: true
        }
    }
];
```

### /src/api/wechat.official.js

> 基于微信官方api的接口封装，文件中注释更全。

```javascript
import axios from 'axios'
import {httpRes as res} from "../lib/utils";
import {WECHAT_LIST} from "../lib/config";

// 获取微信公众号配置信息
export const getConfigById = async id => {
    if (!id) return res.errArgumentMiss;
    let wechatInfo = await think.model(MODEL.TABLE.OFFICIAL).where({id: id}).find();
    if (think.isEmpty(wechatInfo)) return res.err('未查找到公众号')
    return res.suc(wechatInfo);
}

// ..............
```

### /src/api/wechat.miniprogram.js

> 基于微信小程序官方api的接口封装

### /src/controller/wxopen.js

> 对外开放关于微信公众号的api接口

```javascript
module.exports = class extends think.Controller {
   // 微信鉴权第一步
   async go_authAction() {/*.........*/}
  
   // 微信鉴权第二步
   async back_businessAction() {/*.........*/}
  
   // 获取access_token
   async get_access_tokenAction() {/*.........*/}
  
   // ..........
}
```

### /src/controller/serve.js

> 响应微信公众号推送消息的接口

```javascript
module.exports = class extends think.Controller {
  /*
    * 文字消息
    * 接收微信服务器推送的文字内容
    * */
    async textAction() {/*....*/}
  
  /*
    * 事件消息
    * 接收微信服务器推送的事件内容
    * */
    async eventAction() {/*....*/}
  
  // ........
}
```