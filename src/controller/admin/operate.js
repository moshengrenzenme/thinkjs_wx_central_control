/*
* 后台管理系统
* - - 运营相关
* */

const Base = require('./base');
import {httpRes} from "../../lib/utils";
import {MODEL} from "../../lib/config";

module.exports = class extends Base {
    /*
    * 微信公众号
    *   获取用户列表
    * */
    async get_official_user_listAction() {
        let that = this;
        let {page, size = 20} = that.get();
        let {official_id, user_nickname, user_sex, user_subscribe, user_province, user_country, user_city, user_openid} = that.post();
        let where = {};
        if (!think.isEmpty(official_id)) where[`${MODEL.TABLE.OFFICIAL_USER}.official_id`] = ['in', official_id];
        if (!think.isEmpty(user_nickname)) where[`${MODEL.TABLE.OFFICIAL_USER}.nickname`] = ['like', `%${user_nickname}%`];
        if (!think.isEmpty(user_sex)) where[`${MODEL.TABLE.OFFICIAL_USER}.sex`] = ['in', user_sex];
        if (!think.isEmpty(user_subscribe)) where[`${MODEL.TABLE.OFFICIAL_USER}.subscribe`] = user_subscribe;
        if (!think.isEmpty(user_province)) where[`${MODEL.TABLE.OFFICIAL_USER}.province`] = ['like', `%${user_province}%`];
        if (!think.isEmpty(user_country)) where[`${MODEL.TABLE.OFFICIAL_USER}.country`] = ['like', `%${user_country}%`];
        if (!think.isEmpty(user_city)) where[`${MODEL.TABLE.OFFICIAL_USER}.city`] = ['like', `%${user_city}%`];
        if (!think.isEmpty(user_openid)) where[`${MODEL.TABLE.OFFICIAL_USER}.openid`] = user_openid;
        let userListSql = await that.model(MODEL.TABLE.OFFICIAL_USER)
            .join(`${MODEL.TABLE.OFFICIAL} on ${MODEL.TABLE.OFFICIAL}.id = ${MODEL.TABLE.OFFICIAL_USER}.official_id`)
            .field(`
                ${MODEL.TABLE.OFFICIAL_USER}.id as user_id,
                ${MODEL.TABLE.OFFICIAL_USER}.nickname as user_nickname,
                ${MODEL.TABLE.OFFICIAL_USER}.sex as user_sex,
                ${MODEL.TABLE.OFFICIAL_USER}.language as user_language,
                ${MODEL.TABLE.OFFICIAL_USER}.province as user_province,
                ${MODEL.TABLE.OFFICIAL_USER}.country as user_country,
                ${MODEL.TABLE.OFFICIAL_USER}.city as user_city,
                ${MODEL.TABLE.OFFICIAL_USER}.headimgurl as user_headimgurl,
                ${MODEL.TABLE.OFFICIAL_USER}.subscribe as user_subscribe,
                ${MODEL.TABLE.OFFICIAL_USER}.subscribe_time as user_subscribe_time,
                ${MODEL.TABLE.OFFICIAL_USER}.openid as user_openid,
                ${MODEL.TABLE.OFFICIAL}.id as official_id,
                ${MODEL.TABLE.OFFICIAL}.name as official_name
            `)
            .where(where);
        let userList = think.isEmpty(page) ?
            await userListSql.select() :
            await userListSql.page(page, size).countSelect();
        return that.json(httpRes.suc(userList))
    }

    /*
    * 微信公众号
    *   获取用户操作日志
    * */
    async get_official_user_log_listAction() {
        let that = this;
        let {page, size = 20} = that.get();
        let {official_id, log_type, user_nickname, user_openid} = that.post();
        let where = {};
        if (!think.isEmpty(official_id)) where[`${MODEL.TABLE.OFFICIAL_USER}.official_id`] = ['in', official_id];
        if (!think.isEmpty(log_type)) where[`${MODEL.TABLE.OFFICIAL_USER_LOG}.type`] = ['in', log_type];
        if (!think.isEmpty(user_nickname)) where[`${MODEL.TABLE.OFFICIAL_USER}.nickname`] = ['like', `%${user_nickname}%`];
        if (!think.isEmpty(user_openid)) where[`${MODEL.TABLE.OFFICIAL_USER}.openid`] = user_openid;
        let userLogListSql = await that.model(MODEL.TABLE.OFFICIAL_USER_LOG)
            .join(`${MODEL.TABLE.OFFICIAL} on ${MODEL.TABLE.OFFICIAL}.id = ${MODEL.TABLE.OFFICIAL_USER_LOG}.official_id`)
            .join(`${MODEL.TABLE.OFFICIAL_USER} on ${MODEL.TABLE.OFFICIAL_USER}.openid = ${MODEL.TABLE.OFFICIAL_USER_LOG}.openid`)
            .field(`
                ${MODEL.TABLE.OFFICIAL_USER_LOG}.id as log_id,
                ${MODEL.TABLE.OFFICIAL_USER_LOG}.type as log_type,
                ${MODEL.TABLE.OFFICIAL_USER_LOG}.content as log_content,
                ${MODEL.TABLE.OFFICIAL_USER_LOG}.is_success as log_is_success,
                ${MODEL.TABLE.OFFICIAL_USER_LOG}.error_msg as log_error_msg,
                ${MODEL.TABLE.OFFICIAL_USER_LOG}.add_time as log_add_time,
                ${MODEL.TABLE.OFFICIAL_USER}.openid as user_openid,
                ${MODEL.TABLE.OFFICIAL_USER}.nickname as user_nickname,
                ${MODEL.TABLE.OFFICIAL}.id as official_id,
                ${MODEL.TABLE.OFFICIAL}.name as official_name
            `)
            .order({[`${MODEL.TABLE.OFFICIAL_USER_LOG}.add_time`]: 'desc'})
            .where(where);
        let userLogList = think.isEmpty(page) ?
            await userLogListSql.select() :
            await userLogListSql.page(page, size).countSelect();
        return that.json(httpRes.suc(userLogList))
    }
}