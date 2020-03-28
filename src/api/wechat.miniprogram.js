// 微信小程序接口封装
import axios from 'axios'
import {httpRes as res} from "../lib/utils";
import {WECHAT_MINI_PROGRAM_LIST} from "../lib/config";

/*
* 获取微信小程序配置信息
* @argument
*   id：微信公众号id
* @return
*   success => {id:'',name:'',appid:'',appsecret:''}
* */
export const getConfigById = async id => {
    for (let item of WECHAT_MINI_PROGRAM_LIST) if (Number(id) === item.id) return res.suc(item)
    return res.err('未查找到小程序')
}

/*
  * 获取accessToken
  * @argument
  *   id：小程序id
  * @return
  *   success => { access_token:'', expires_in:''}
  * */
export const getAccessTokenById = async id => {
    let accessTokenInfo = await think.cache(`wechatProgramAccessTokenById_${id}`);
    if (accessTokenInfo) return res.suc(accessTokenInfo);
    let wxCfgRes = await getConfigById(id);
    if (wxCfgRes.code !== 0) return wxCfgRes;
    let {data: {appid, appsecret}} = wxCfgRes;
    let {data} = await axios({
        method: 'get',
        url: `https://api.weixin.qq.com/cgi-bin/token`,
        params: {grant_type: 'client_credential', appid: appid, secret: appsecret}
    });
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    await think.cache(`wechatProgramAccessTokenById_${id}`, data);
    return res.suc(data);
}

/*
* 登录凭证校验
* @argument
*   id：小程序id
*   code：登录时获取的code
* @return
*   success => {
*       openid:'', => 用户唯一标识
*       session_key:'', => 会话密钥
*       unionid:'', => 用户在开放平台的唯一标识符，在满足 UnionID 下发条件的情况下会返回。
*       errcode:'', => 错误码
*       errmsg:'' => 错误信息
*   }
* */
export const getOpenIdByCode = async (id, code) => {
    let configRes = await getConfigById(id);
    if (configRes.code !== 0) return configRes;
    let {data: {appid, appsecret}} = configRes;
    let {data} = await axios({
        method: 'get',
        url: 'https://api.weixin.qq.com/sns/jscode2session',
        params: {appid: appid, secret: appsecret, js_code: code, grant_type: 'authorization_code'}
    })
    if (data.errcode) return res.err(data.errmsg, data.errcode);
    return res.suc(data);
}