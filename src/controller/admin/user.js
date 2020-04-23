/*
* 后台管理系统
* - - 用户相关
* */
const Base = require('./base');
import {httpRes} from "../../lib/utils";
import {MODEL, ADMIN_LOGIN_SESSION_NAME} from "../../lib/config";

module.exports = class extends Base {
    // 用户登录
    async loginAction() {
        let that = this;
        let {username, password} = that.post();
        if (think.isEmpty(username) || think.isEmpty(password)) return that.json(httpRes.errArgumentMiss);
        // 用户信息
        let user = await that.model(MODEL.TABLE.ADMIN_USER)
            .where({username, password}).fieldReverse('password').find();
        if (think.isEmpty(user)) return that.json(httpRes.err('用户名或密码不正确'));
        let roleIds = await that.model(MODEL.TABLE.ADMIN_USER_ROLE).where({user_id: user.id}).getField('role_id');
        if (!roleIds.length) return that.json(httpRes.err('您没有配置任何角色'));
        // 权限列表
        let auth = await that.model(MODEL.TABLE.ADMIN_ROLE_AUTH)
            .join(`${MODEL.TABLE.ADMIN_AUTH} on ${MODEL.TABLE.ADMIN_AUTH}.id = ${MODEL.TABLE.ADMIN_ROLE_AUTH}.auth_id`)
            .field(`
                ${MODEL.TABLE.ADMIN_AUTH}.id as auth_id,
                ${MODEL.TABLE.ADMIN_AUTH}.name as auth_name,
                ${MODEL.TABLE.ADMIN_AUTH}.type as auth_type,
                ${MODEL.TABLE.ADMIN_AUTH}.parent_id as auth_parent_id,
                ${MODEL.TABLE.ADMIN_AUTH}.sort as auth_sort,
                ${MODEL.TABLE.ADMIN_AUTH}.group_name as auth_group_name,
                ${MODEL.TABLE.ADMIN_AUTH}.router as auth_router
                `)
            .where({
                [`${MODEL.TABLE.ADMIN_ROLE_AUTH}.role_id`]: ['in', roleIds]
            })
            .order({
                [`${MODEL.TABLE.ADMIN_AUTH}.sort`]: 'asc'
            })
            .select();
        await that.session(ADMIN_LOGIN_SESSION_NAME, {user: user, auth: auth});
        return that.json(httpRes.suc({user: user, auth: auth}))
    }

    // 用户退出
    async logoutAction() {
        let that = this;
        await that.session(ADMIN_LOGIN_SESSION_NAME, null);
        return that.json(httpRes.suc())
    }
}