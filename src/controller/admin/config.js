/*
* 后台管理系统
* - - 配置相关
* */

const Base = require('./base');
import {httpRes} from "../../lib/utils";
import {MODEL, CENTRAL_CONTROL_SERVE_URL, WECHAT_DEVELOPER_ROUTE, WECHAT_DEVELOPER_TOKEN} from "../../lib/config";
import {getAccessTokenById} from "../../api/wechat.official";

module.exports = class extends Base {
    /*
    * 公众号
    *   获取列表
    * */
    async get_official_listAction() {
        let that = this;
        let {page, size = 20} = that.get();
        let {name, desc, appid, secret} = that.post();
        let where = {};
        if (!think.isEmpty(name)) where[`${MODEL.TABLE.OFFICIAL}.name`] = ['like', `%${name}%`];
        if (!think.isEmpty(desc)) where[`${MODEL.TABLE.OFFICIAL}.desc`] = ['like', `%${desc}%`];
        if (!think.isEmpty(appid)) where[`${MODEL.TABLE.OFFICIAL}.appid`] = appid;
        if (!think.isEmpty(secret)) where[`${MODEL.TABLE.OFFICIAL}.secret`] = secret;
        let officialSql = await that.model(MODEL.TABLE.OFFICIAL)
            .field(`
                ${MODEL.TABLE.OFFICIAL}.id as official_id,
                ${MODEL.TABLE.OFFICIAL}.name as official_name,
                ${MODEL.TABLE.OFFICIAL}.desc as official_desc,
                ${MODEL.TABLE.OFFICIAL}.appid as official_appid,
                ${MODEL.TABLE.OFFICIAL}.secret as official_secret,
                ${MODEL.TABLE.OFFICIAL}.qr_img_url as official_qr_img_url,
                ${MODEL.TABLE.OFFICIAL}.add_time as official_add_time,
                ${MODEL.TABLE.OFFICIAL}.update_time as official_update_time
            `)
            .where(where);
        let officialList = think.isEmpty(page) ?
            await officialSql.select() :
            await officialSql.page(page, size).countSelect();
        return that.json(httpRes.suc(officialList))
    }

    /*
    * 公众号
    *   获取详情
    * */
    async get_official_infoAction() {
        let that = this;
        let {official_id} = that.post();
        if (think.isEmpty(official_id)) return that.json(httpRes.errArgumentMiss);
        let resData = await that.model(MODEL.TABLE.OFFICIAL)
            .field(`
                ${MODEL.TABLE.OFFICIAL}.id as official_id,
                ${MODEL.TABLE.OFFICIAL}.name as official_name,
                ${MODEL.TABLE.OFFICIAL}.desc as official_desc,
                ${MODEL.TABLE.OFFICIAL}.appid as official_appid,
                ${MODEL.TABLE.OFFICIAL}.secret as official_secret,
                ${MODEL.TABLE.OFFICIAL}.qr_img_url as official_qr_img_url
            `)
            .where({[`${MODEL.TABLE.OFFICIAL}.id`]: official_id})
            .find();
        return that.json(httpRes.suc(resData));
    }

    /*
    * 公众号
    *   新增｜编辑信息
    * */
    async edit_official_infoAction() {
        let that = this;
        let {official_id, official_name, official_desc, official_appid, official_secret, official_qr_img_url} = that.post();
        if (think.isEmpty(official_name) || think.isEmpty(official_desc) || think.isEmpty(official_appid) || think.isEmpty(official_secret)) return that.json(httpRes.errArgumentMiss);
        let handleData = {
            name: official_name,
            desc: official_desc,
            appid: official_appid,
            secret: official_secret,
            qr_img_url: official_qr_img_url
        };
        if (official_id) {
            // 修改管理员信息
            let updateRow = await that.model(MODEL.TABLE.OFFICIAL)
                .where({id: official_id})
                .update(think.extend(handleData, {update_time: new Date().getTime()}))
            // 删除角色信息
            await that.model(MODEL.TABLE.ADMIN_USER_ROLE)
                .where({user_id: user_id})
                .delete();
        } else {
            // 新增管理员信息
            official_id = await that.model(MODEL.TABLE.OFFICIAL)
                .add(think.extend(handleData, {is_enable: 0, add_time: new Date().getTime()}));
        }
        return that.json(httpRes.suc());
    }

    /*
    * 公众号
    *   获取接口配置信息
    * */
    async get_official_interface_configuration_infoAction() {
        let that = this;
        let {official_id} = that.post();
        if (think.isEmpty(official_id)) return that.json(httpRes.errArgumentMiss);
        let resData = {
            url: CENTRAL_CONTROL_SERVE_URL + WECHAT_DEVELOPER_ROUTE + '?id=' + official_id,
            token: WECHAT_DEVELOPER_TOKEN
        }
        return that.json(httpRes.suc(resData));
    }

    /*
    * 公众号
    *   获取ACCESS_TOKEN
    * */
    async get_official_access_tokenAction() {
        let that = this;
        let {official_id} = that.post();
        if (think.isEmpty(official_id)) return that.json(httpRes.errArgumentMiss);
        let accessToken = await getAccessTokenById(official_id);
        return that.json(accessToken)
    }
}