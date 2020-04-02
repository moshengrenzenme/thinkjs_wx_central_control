// 微信接口封装

const fs = require('fs');
const request = require('request');
import axios from 'axios';
import {httpRes as res} from "../lib/utils";
import {MODEL} from "../lib/config";

/*
* 获取微信公众号配置信息
* @argument
*   id：微信公众号id
* @return
*   success => {id:'',name:'',appid:'',secret:''}
* */
export const getConfigById = async id => {
    if (!id) return res.errArgumentMiss;
    let wechatInfo = await think.model(MODEL.TABLE.OFFICIAL).where({id: id}).find();
    if (think.isEmpty(wechatInfo)) return res.err('未查找到公众号')
    return res.suc(wechatInfo);
}

/*
  * 获取accessToken
  * @argument
  *   id：微信公众号id
  * @return
  *   success => { access_token:'', expires_in:''}
  * */
export const getAccessTokenById = async id => {
    // 1、获取缓存
    let accessTokenInfo = await think.cache(`wechatOfficialAccessTokenById_${id}`);
    if (accessTokenInfo) return res.suc(accessTokenInfo);
    // 2、缓存没有，获取接口
    let wxCfgRes = await getConfigById(id);
    if (wxCfgRes.code !== 0) return wxCfgRes;
    let {data: {appid, secret}} = wxCfgRes;
    let {data} = await axios({
        method: 'get',
        url: `https://api.weixin.qq.com/cgi-bin/token`,
        params: {grant_type: 'client_credential', appid: appid, secret: secret}
    });
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    // 3、保存缓存
    await think.cache(`wechatOfficialAccessTokenById_${id}`, data);
    return res.suc(data);
}

/*
* 获取JsapiTicket
* @argument
*   id：微信公众号id
* @return
*   success => {ticket:'',expires_in:0000}，
* */
export const getJsapiTicketById = async id => {
    // 1、获取缓存
    let jsapiTicketInfo = await think.cache(`wechatOfficialJsapiTicketById_${id}`);
    if (jsapiTicketInfo) return res.suc(jsapiTicketInfo);
    // 2、缓存没有，获取接口
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'get',
        url: `https://api.weixin.qq.com/cgi-bin/ticket/getticket`,
        params: {access_token: access_token, type: 'jsapi'}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    // 3、保存缓存
    await think.cache(`wechatOfficialJsapiTicketById_${id}`, data);
    return res.suc(data);
}

/*
* 获取微信服务器地址
* @argument
*   id：微信公众号id
*   type：类型（callback / api）
* @return
*   success => ["127.0.0.1","".....]
* */
export const getIps = async (id, type = 'callback') => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let urls = {
        callback: 'https://api.weixin.qq.com/cgi-bin/getcallbackip',
        api: 'https://api.weixin.qq.com/cgi-bin/get_api_domain_ip'
    }
    let {data} = await axios({
        method: 'get',
        url: urls[type],
        params: {access_token: access_token}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc(data.ip_list);
}

/*
* 获取自定义菜单配置
* @argument
*   id：微信公众号id
* @return
*   success => {
*       is_menu_opend : '0', => 菜单是否开启，0代表未开启，1代表开启
*       selfmenu_info : { => 菜单信息
*           button : [ => 菜单按钮
*               {
*                   type : "", => 菜单的类型，公众平台官网上能够设置的菜单类型有view（跳转网页）、text（返回文本，下同）、img、photo、video、voice。
*                   name : "", => 菜单名称
*                   value / url / key : "", => 对于不同的菜单类型，value的值意义不同。官网上设置的自定义菜单： Text:保存文字到value； Img、voice：保存mediaID到value； Video：保存视频下载链接到value； News：保存图文消息到news_info，同时保存mediaID到value； View：保存链接到url。 使用API设置的自定义菜单： click、scancode_push、scancode_waitmsg、pic_sysphoto、pic_photo_or_album、 pic_weixin、location_select：保存值到key；view：保存链接到url
*                   news_info : { => 图文消息的信息
*                       list : [{
*                           title : "", => 图文消息的标题
*                           digest : "", => 摘要
*                           author : "", => 作者
*                           show_cover : "", => 是否显示封面，0为不显示，1为显示
*                           cover_url : "", => 封面图片的URL
*                           content_url : "", => 正文的URL
*                           source_url : "", => 原文的URL，若置空则无查看原文入口
*                       }]
*                   }
*                   sub_button : [], => 子菜单
*               }
*           ]
*       }
*   }
* */
export const getCurrSelfMenuInfo = async id => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'get',
        url: 'https://api.weixin.qq.com/cgi-bin/get_current_selfmenu_info',
        params: {access_token: access_token}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc(data);
}

/*
* 创建自定义菜单接口
* @argument
*   id：微信公众号id
*   button ： [{ => 一级菜单数组，个数应为1~3个
*       "name": "", => 菜单标题，不超过16个字节，子菜单不超过60个字节
*       "sub_button": [{ => 二级菜单数组，个数应为1~5个
*           "type": "", => 菜单的响应动作类型，view表示网页类型，click表示点击类型，miniprogram表示小程序类型
*           "key": "", => 菜单KEY值，用于消息接口推送，不超过128字节
*           "media_id": "", => 调用新增永久素材接口返回的合法media_id
*           "url": "", => 网页 链接，用户点击菜单可打开链接，不超过1024字节。 type为miniprogram时，不支持小程序的老版本客户端将打开本url。
*           "appid": "", => 小程序的appid（仅认证公众号可配置）
*           "pagepath": "", => 小程序的页面路径
*       }]
*   }]
* @return
*   success => {"errcode":0,"errmsg":"ok"}
* */
export const createMenu = async (id, button = []) => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'post',
        url: ' https://api.weixin.qq.com/cgi-bin/menu/create',
        params: {access_token: access_token},
        data: {button: button}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc(data);
}

/*
* 删除自定义菜单接口
* @argument
*   id：微信公众号id
* @return
*   success => {"errcode":0,"errmsg":"ok"}
* */
export const deleteMenu = async id => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'post',
        url: ' https://api.weixin.qq.com/cgi-bin/menu/delete',
        params: {access_token: access_token},
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc(data);
}

/*
* 获取用户信息
* @argument
*   id：微信公众号id
*   openid：用户openid
* @return
*   success => {
*       subscribe:'', => 用户是否订阅该公众号标识，值为0时，代表此用户没有关注该公众号，拉取不到其余信息。
*       openid:'', => 用户的标识，对当前公众号唯一
*       nickname:'', => 用户的昵称
*       sex:'', => 用户的性别，值为1时是男性，值为2时是女性，值为0时是未知
*       language:'', => 用户的语言，简体中文为zh_CN
*       city:'', => 用户所在城市
*       province:'', => 用户所在省份
*       country:'', => 用户所在国家
*       headimgurl:'', => 用户头像，最后一个数值代表正方形头像大小（有0、46、64、96、132数值可选，0代表640*640正方形头像），用户没有头像时该项为空。若用户更换头像，原有头像URL将失效。
*       subscribe_time:'', => 用户关注时间，为时间戳。如果用户曾多次关注，则取最后关注时间
*       remark:'', => 公众号运营者对粉丝的备注，公众号运营者可在微信公众平台用户管理界面对粉丝添加备注
*       groupid:'', => 用户所在的分组ID（兼容旧的用户分组接口）
*       tagid_list:'', => 用户被打上的标签ID列表
*       subscribe_scene:'', => 返回用户关注的渠道来源，ADD_SCENE_SEARCH 公众号搜索，ADD_SCENE_ACCOUNT_MIGRATION 公众号迁移，ADD_SCENE_PROFILE_CARD 名片分享，ADD_SCENE_QR_CODE 扫描二维码，ADD_SCENE_PROFILE_LINK 图文页内名称点击，ADD_SCENE_PROFILE_ITEM 图文页右上角菜单，ADD_SCENE_PAID 支付后关注，ADD_SCENE_OTHERS 其他
*       qr_scene:'', => 二维码扫码场景（开发者自定义）
*       qr_scene_str:'' =>二维码扫码场景描述（开发者自定义）
*   }
* */
export const getUserInfo = async (id, openid) => {
    // 1、获取缓存
    let cacheUserInfo = await think.cache(`wechatOfficialUser_${id}_${openid}`);
    if (cacheUserInfo && cacheUserInfo.subscribe === 1) return res.suc(cacheUserInfo);
    // 2、缓存没有或未关注，获取数据库
    let modelUserInfo = await think.model(MODEL.TABLE.OFFICIAL_USER).where({openid: openid}).find();
    if (!think.isEmpty(modelUserInfo) && modelUserInfo.subscribe === 1) {
        await think.cache(`wechatOfficialUser_${id}_${openid}`, modelUserInfo);
        return res.suc(cacheUserInfo);
    }
    // 3、数据库没有或未关注，获取接口
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'get',
        url: `https://api.weixin.qq.com/cgi-bin/user/info`,
        params: {access_token: access_token, openid: openid, lang: 'zh_CN'}
    });
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    // 4、接口获取回，更新数据库、保存缓存
    await think.model(MODEL.TABLE.OFFICIAL_USER).thenUpdate(Object.assign({official_id: id}, data), {openid: openid});
    await think.cache(`wechatOfficialUser_${id}_${openid}`, data);
    return res.suc(data);
}

/*
* 删除用户信息缓存
* */
export const resetCacheUserInfo = async (id, openid) => {
    await think.cache(`wechatOfficialUser_${id}_${openid}`, null);
}

/*
* 根据鉴权后的code获取用户openid
* @argument
*   id：微信公众号id
*   code：鉴权后的code
* @return
*   success => {
*       access_token:'', => 网页授权接口调用凭证,注意：此access_token与基础支持的access_token不同
*       expires_in:'', => access_token接口调用凭证超时时间，单位（秒）
*       refresh_token:'', => 用户刷新access_token
*       openid:'', => 用户唯一标识
*       scope:'' => 用户授权的作用域，使用逗号（,）分隔
*   }
* */
export const getOpenIdByAuth = async (id, code) => {
    let wxCfgRes = await getConfigById(id);
    if (wxCfgRes.code !== 0) return wxCfgRes;
    let {data: {appid, appsecret}} = wxCfgRes;
    let {data} = await axios({
        method: 'get',
        url: 'https://api.weixin.qq.com/sns/oauth2/access_token',
        params: {
            appid: appid,
            sercet: appsecret,
            code: code,
            grant_type: 'authorization_code'
        }
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc(data);
}

/*
* 根据鉴权后的AccessToken获取用户信息
* @argument
*   openid：用户openid
*   accessToken：鉴权后获取的accessToken
* @return
*   success => {
*       openid:'', => 用户的唯一标识
*       nickname:'', => 用户昵称
*       sex:'', => 用户的性别，值为1时是男性，值为2时是女性，值为0时是未知
*       province:'', => 用户个人资料填写的省份
*       city:'', => 普通用户个人资料填写的城市
*       country:'', => 国家，如中国为CN
*       headimgurl:'', => 用户头像，最后一个数值代表正方形头像大小（有0、46、64、96、132数值可选，0代表640*640正方形头像），用户没有头像时该项为空。若用户更换头像，原有头像URL将失效。
*       privilege:'', => 用户特权信息，json 数组，如微信沃卡用户为（chinaunicom）
*       unionid:'' => 只有在用户将公众号绑定到微信开放平台帐号后，才会出现该字段。
*   }
* */
export const getUserInfoByAuth = async (openid, accessToken) => {
    let {data} = await axios({
        method: 'get',
        url: "https://api.weixin.qq.com/sns/userinfo",
        params: {access_token: accessToken, openid: openid, lang: 'zh_CN'}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    await think.model(MODEL.TABLE.OFFICIAL_USER).thenUpdate(data, {openid: openid});
    return res.suc(data);
}

/*
* 获取用户openid列表
* @argument
*   id：微信公众号id
*   nextOpenid：第一个openid，默认从头
* @return
*   success => {
*       total : 1, => 关注该公众账号的总用户数
*       count : 1, => 拉取的OPENID个数，最大值为10000
*       data : { => 列表数据
*           openid : ['oAfMNxOORo6ON-Cqcx9VUozKy_Ns'] => OPENID的列表
*       },
*       next_openid : 'oAfMNxOORo6ON-Cqcx9VUozKy_Ns' => 拉取列表的最后一个用户的OPENID
*   }
* */
export const getUserOpenidList = async (id, nextOpenid) => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'get',
        url: 'https://api.weixin.qq.com/cgi-bin/user/get',
        params: {access_token: access_token, next_openid: nextOpenid}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc(data);
}

/*
* 发送客服消息 => 文字
* @argument
*   id：微信公众号id
*   openid：用户openid
*   text：发布的文字内容
* @return
*   null
* */
export const customSendText = async (id, openid, text) => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'post',
        url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send',
        params: {access_token: access_token},
        data: {touser: openid, msgtype: 'text', text: {content: text}}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc();
}

/*
* 发送客服消息 => 语音
* @argument
*   id：微信公众号id
*   openid：用户openid
*   mediaId：语音mediaId
* @return
*   null
* */
export const customSendVoice = async (id, openid, mediaId) => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'post',
        url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send',
        params: {access_token: access_token},
        data: {touser: openid, msgtype: 'voice', voice: {media_id: mediaId}}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc();
}

/*
* 发送客服消息 => 图片
* @argument
*   id：微信公众号id
*   openid：用户openid
*   mediaId：图片mediaId
* @return
*   null
* */
export const customSendImage = async (id, openid, mediaId) => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'post',
        url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send',
        params: {access_token: access_token},
        data: {touser: openid, msgtype: 'image', image: {media_id: mediaId}}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc();
}

/*
* 发送客服消息 => 音乐
* @argument
*   id：微信公众号id
*   openid：用户openid
*   info：音乐相关信息
*       title：音乐标题
*       desc：音乐描述
*       playUrl：音乐播放地址
*       playHqUrl：高清音乐播放地址
*       mediaId：内容id
* @return
*   null
* */
export const customSendMusic = async (id, openid, info) => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'post',
        url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send',
        params: {access_token: access_token},
        data: {
            touser: openid, msgtype: 'music',
            music: {
                title: info.title,
                description: info.desc,
                musicurl: info.playUrl,
                hqmusicurl: info.playHqUrl,
                thumb_media_id: info.mediaId
            }
        }
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc();
}

/*
* 发送客服消息 => 文章
* @argument
*   id：微信公众号id
*   openid：用户openid
*   info：文章相关信息
*       title：标题
*       desc：描述
*       url：跳转链接
*       imgUrl：封面链接
* @return
*   null
* */
export const customSendArticle = async (id, openid, info) => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'post',
        url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send',
        params: {access_token: access_token},
        data: {
            touser: openid, msgtype: 'news',
            news: {
                articles: [{
                    title: info.title,
                    description: info.desc,
                    url: info.url,
                    picurl: info.imgUrl
                }]
            }
        }
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc();
}

/*
* 获取模版消息列表
* @argument
*   id：微信公众号id
* @return
*    [{
*        template_id:'',
*        title:'',
*        primary_industry:'',
*        deputy_industry:'',
*        content:'',
*        example:''
*    },....]
* */
export const getPrivateTemplateAll = async id => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'get',
        url: 'https://api.weixin.qq.com/cgi-bin/template/get_all_private_template',
        params: {access_token: access_token}
    });
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc(data.template_list);
}

/*
* 删除模版
* @argument
*   id：微信公众号id
*   templateId：公众帐号下模板消息ID
* @return
*   success => {"errcode" : 0,"errmsg" : "ok"}
* */
export const deletePrivateTemplate = async (id, templateId) => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'post',
        url: 'https://api.weixin.qq.com/cgi-bin/template/del_private_template',
        params: {access_token: access_token},
        data: {template_id: templateId}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc(data.template_list);
}

/*
* 发送模版消息
* @argument
*   id：微信公众号id
*   openid：用户openid
*   templateId：模版id
*   url：跳转外链
*   mini：小程序相关信息
*       appid：小程序appid
*       pagepath：小程序页面路径
*   info：模版填充内容
*       {first:{color:"",value:''}....}
* @return
*   null
* */
export const templateSend = async (id, openid, templateId, url, mini, info) => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'post',
        url: 'https://api.weixin.qq.com/cgi-bin/message/template/send',
        params: {access_token: access_token},
        data: {
            touser: openid,
            template_id: templateId,
            url: url,
            minprogram: mini,
            data: info
        }
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc();
}

/*
* 生成参数二维码
* @argument
*   id：微信公众号id
*   type：1：临时整型；2：临时字符串；3：永久整型；4：永久字符串（默认2）
*   second：过期时间（单位秒，默认30天）
*   content：参数内容
* @return
*   success => {
*       img_url:'', => 二维码图片地址
*       ticket:'', => 二维码ticket
*       expire_second:'', => 过期时间
*       url:'' => 二维码地址
*   }
* */
export const createParamsQr = async (id, content, type = 2, second = 2592000) => {
    let actionNames = {
        1: {name: 'QR_SCENE', key: 'scene_id'},
        2: {name: 'QR_STR_SCENE', key: 'scene_str'},
        3: {name: 'QR_LIMIT_SCENE', key: 'scene_id'},
        4: {name: 'QR_LIMIT_STR_SCENE', key: 'scene_str'}
    };
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'post',
        url: 'https://api.weixin.qq.com/cgi-bin/qrcode/create',
        params: {access_token: access_token},
        data: {
            expire_seconds: second,
            action_name: actionNames[type].name,
            action_info: {scene: {[actionNames[type].key]: content}}
        }
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc(Object.assign({img_url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${data.ticket}`}, data));
}

/*
* 长链转短链
* @argument
*   id：微信公众号id
*   url：需要转换的长链接
* @return
*   success => {
*       errcode:0,
*       errmsg:0,
*       short_url:'' => 短链接
*   }
* */
export const createShortUrl = async (id, url) => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'post',
        url: 'https://api.weixin.qq.com/cgi-bin/shorturl',
        params: {access_token: access_token},
        data: {action: 'long2short', long_url: url}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc(data);
}

/*
* 新增临时素材
* @argument
*   id：微信公众号id
*   type：媒体文件类型，分别有图片（image）、语音（voice）、视频（video）和缩略图（thumb，主要用于视频与音乐格式的缩略图）
*   contentType：文件类型
*   path：文件路径
* @return
*   success => {
*       type:'', => 媒体文件类型，分别有图片（image）、语音（voice）、视频（video）和缩略图（thumb，主要用于视频与音乐格式的缩略图）
*       media_id:'', => 媒体文件上传后，获取标识
*       created_at:'' => 媒体文件上传时间戳
*   }
* */
export const uploadMedia = async (id, type, contentType, path) => {
    let allowType = ['image', 'voice', 'video', 'thumb'];
    let suffix = contentType.split('/')[1];
    if (!allowType.includes(type)) return res.err('不合适的文件文件类型');
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    return new Promise(function (resolve, reject) {
        request.post({
            url: `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${access_token}&type=${type}`,
            formData: {
                media: {
                    value: fs.readFileSync(path),
                    options: {filename: `${think.uuid}.${suffix}`, contentType: contentType}
                }
            }
        }, function optionalCallback(err, httpResponse, body) {
            if (err) {
                resolve(res.err('upload failed:' + err.toString()))
            }
            resolve(res.suc(JSON.parse(body)));
        });
    })
}

/*
* 获取临时素材
* @argument
*   id：微信公众号id
*   mediaId：媒体文件ID
* @return
*   success => {}
* */
export const getMedia = async (id, mediaId) => {
    let accessTokenRes = await getAccessTokenById(id);
    if (accessTokenRes.code != 0) return accessTokenRes;
    let {data: {access_token}} = accessTokenRes;
    let {data} = await axios({
        method: 'get',
        url: 'https://api.weixin.qq.com/cgi-bin/media/get',
        params: {access_token: access_token, media_id: mediaId}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc(data);
}