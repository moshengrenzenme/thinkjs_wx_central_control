/*
* 后台管理系统
* - - 系统相关
* */

const Base = require('./base');
import {httpRes} from "../../lib/utils";
import {MODEL, ADMIN_LOGIN_SESSION_NAME} from "../../lib/config";

module.exports = class extends Base {
    /*
    * 管理员
    *   登录
    * */
    async loginAction() {
        let that = this;
        let {username, password} = that.post();
        if (think.isEmpty(username) || think.isEmpty(password)) return that.json(httpRes.errArgumentMiss);
        // 管理员信息
        let user = await that.model(MODEL.TABLE.ADMIN_USER)
            .where({username: username, password: password, is_enable: 1})
            .fieldReverse('password')
            .find();
        if (think.isEmpty(user)) return that.json(httpRes.err('管理员名或密码不正确'));
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

    /*
    * 管理员
    *   登出
    * */
    async logoutAction() {
        let that = this;
        await that.session(ADMIN_LOGIN_SESSION_NAME, null);
        return that.json(httpRes.suc())
    }

    /*
    * 管理员
    *   获取列表
    * */
    async get_user_listAction() {
        let that = this;
        let {page, size = 20} = that.get();
        let {username, nickname, phone} = that.post();
        let where = {};
        if (!think.isEmpty(username)) where[`${MODEL.TABLE.ADMIN_USER}.username`] = ['like', `%${username}%`];
        if (!think.isEmpty(nickname)) where[`${MODEL.TABLE.ADMIN_USER}.nickname`] = ['like', `%${nickname}%`];
        if (!think.isEmpty(phone)) where[`${MODEL.TABLE.ADMIN_USER}.phone`] = ['like', `%${phone}%`];
        let userListSql = await that.model(MODEL.TABLE.ADMIN_USER)
            .field(`
                ${MODEL.TABLE.ADMIN_USER}.id as user_id,
                ${MODEL.TABLE.ADMIN_USER}.username as user_username,
                ${MODEL.TABLE.ADMIN_USER}.nickname as user_nickname,
                ${MODEL.TABLE.ADMIN_USER}.phone as user_phone,
                ${MODEL.TABLE.ADMIN_USER}.is_enable as user_is_enable     
            `)
            .where(where);
        let userList = think.isEmpty(page) ?
            await userListSql.select() :
            await userListSql.page(page, size).countSelect();
        return that.json(httpRes.suc(userList))
    }

    /*
    * 管理员
    *   获取详情
    * */
    async get_user_infoAction() {
        let that = this;
        let {user_id} = that.post();
        if (think.isEmpty(user_id)) return that.json(httpRes.errArgumentMiss);
        // 获取管理员信息
        let user = await that.model(MODEL.TABLE.ADMIN_USER).where({id: user_id}).find();
        if (think.isEmpty(user)) return that.json(httpRes.err('管理员不存在'));
        // 获取管理员配置的角色id
        let userRoleIds = await that.model(MODEL.TABLE.ADMIN_USER_ROLE).where({user_id: user.id}).getField('role_id');
        // 组装返回信息
        let resData = {
            user_id: user.id,
            user_username: user.username,
            user_nickname: user.nickname,
            user_phone: user.phone,
            user_role_ids: userRoleIds
        }
        return that.json(httpRes.suc(resData));
    }

    /*
    * 管理员
    *   修改信息
    * */
    async edit_user_infoAction() {
        let that = this;
        let {user_id, user_username, user_nickname, user_phone, user_role_ids} = that.post();
        if (think.isEmpty(user_username) || think.isEmpty(user_nickname) || think.isEmpty(user_phone)) return that.json(httpRes.errArgumentMiss);
        let handleData = {username: user_username, nickname: user_nickname, phone: user_phone};
        if (user_id) {
            // 修改管理员信息
            let updateRow = await that.model(MODEL.TABLE.ADMIN_USER)
                .where({id: user_id})
                .update(think.extend(handleData, {update_time: new Date().getTime()}))
            // 删除角色信息
            await that.model(MODEL.TABLE.ADMIN_USER_ROLE)
                .where({user_id: user_id})
                .delete();
        } else {
            // 新增管理员信息
            user_id = await that.model(MODEL.TABLE.ADMIN_USER)
                .add(think.extend(handleData, {is_enable: 0, add_time: new Date().getTime()}));
        }
        if (!think.isEmpty(user_role_ids)) {
            // 添加新的角色信息
            await that.model(MODEL.TABLE.ADMIN_USER_ROLE)
                .addMany(user_role_ids.map(role_id => {
                    return {role_id: role_id, user_id: user_id}
                }));
        }
        return that.json(httpRes.suc());
    }

    /*
    * 管理员
    *   启用｜禁用
    * */
    async change_user_enabelAction() {
        let that = this;
        let {user_id} = that.post();
        if (think.isEmpty(user_id)) return that.json(httpRes.errArgumentMiss);
        let updateRow = await that.model(MODEL.TABLE.ADMIN_USER)
            .where({id: user_id})
            .update({is_enable: ['exp', '1-is_enable'], update_time: new Date().getTime()})
        return that.json(updateRow ? httpRes.suc() : httpRes.errNoDataHasUpdate)
    }

    /*
    * 角色
    *   获取列表
    * */
    async get_role_listAction() {
        let that = this;
        let {page, size = 20} = that.get();
        let {name} = that.post();
        let where = {};
        if (!think.isEmpty(name)) where[`${MODEL.TABLE.ADMIN_ROLE}.name`] = ['like', `%${name}%`];
        let roleListSql = await that.model(MODEL.TABLE.ADMIN_ROLE)
            .field(`
                ${MODEL.TABLE.ADMIN_ROLE}.id as role_id,
                ${MODEL.TABLE.ADMIN_ROLE}.name as role_name
            `)
            .where(where);
        let roleList = think.isEmpty(page) ?
            await roleListSql.select() :
            await roleListSql.page(page, size).countSelect();
        return that.json(httpRes.suc(roleList))
    }

    /*
    * 角色
    *   获取详情
    * */
    async get_role_infoAction() {
        let that = this;
        let {role_id} = await that.post();
        if (think.isEmpty(role_id)) return that.json(httpRes.errArgumentMiss);
        // 获取角色信息
        let role = await that.model(MODEL.TABLE.ADMIN_ROLE).where({id: role_id}).find();
        if (think.isEmpty(role)) return that.json(httpRes.err('该角色不存在'));
        // 获取角色对应的权限id
        let roleAuthIds = await that.model(MODEL.TABLE.ADMIN_ROLE_AUTH).where({role_id: role.id}).getField('auth_id');
        // 组装返回信息
        let resData = {
            role_id: role.id,
            role_name: role.name,
            role_auth_ids: roleAuthIds
        }
        return that.json(httpRes.suc(resData));
    }

    /*
    * 角色
    *   修改信息
    * */
    async edit_role_infoAction() {
        let that = this;
        let {role_id, role_name, role_auth_ids} = that.post();
        if (think.isEmpty(role_name)) return that.json(httpRes.errArgumentMiss);
        let handleData = {name: role_name};
        if (role_id) {
            // 修改角色信息
            let updateRow = await that.model(MODEL.TABLE.ADMIN_ROLE)
                .where({id: role_id})
                .update(handleData)
            // 删除已配置的权限
            await that.model(MODEL.TABLE.ADMIN_ROLE_AUTH).where({role_id: role_id}).delete();
        } else {
            // 添加角色信息
            role_id = await that.model(MODEL.TABLE.ADMIN_ROLE)
                .add(handleData);
        }
        if (!think.isEmpty(role_auth_ids)) {
            // 添加新的角色对应权限信息
            await that.model(MODEL.TABLE.ADMIN_ROLE_AUTH)
                .addMany(role_auth_ids.map(auth_id => {
                    return {role_id: role_id, auth_id: auth_id}
                }));
        }
        return that.json(httpRes.suc());
    }

    /*
    * 权限
    *   获取列表
    * */
    async get_auth_listAction() {
        let that = this;
        let {page, size = 20} = that.get();
        let {name, group_name, type, router} = that.post();
        let where = {};
        if (!think.isEmpty(name)) where[`${MODEL.TABLE.ADMIN_AUTH}.name`] = ['like', `%${name}%`];
        if (!think.isEmpty(group_name)) where[`${MODEL.TABLE.ADMIN_AUTH}.group_name`] = ['like', `%${group_name}%`];
        if (!think.isEmpty(type)) where[`${MODEL.TABLE.ADMIN_AUTH}.type`] = type;
        if (!think.isEmpty(router)) where[`${MODEL.TABLE.ADMIN_AUTH}.router`] = ['like', `%${router}%`];
        let authListSql = await that.model(MODEL.TABLE.ADMIN_AUTH)
            .field(`
                ${MODEL.TABLE.ADMIN_AUTH}.id as auth_id,
                ${MODEL.TABLE.ADMIN_AUTH}.name as auth_name,
                ${MODEL.TABLE.ADMIN_AUTH}.group_name as auth_group_name,
                ${MODEL.TABLE.ADMIN_AUTH}.parent_id as auth_parent_id,
                ${MODEL.TABLE.ADMIN_AUTH}.sort as auth_sort,
                ${MODEL.TABLE.ADMIN_AUTH}.type as auth_type,
                ${MODEL.TABLE.ADMIN_AUTH}.router as auth_router
            `)
            .order({
                [`${MODEL.TABLE.ADMIN_AUTH}.type`]: 'asc',
                [`${MODEL.TABLE.ADMIN_AUTH}.sort`]: 'asc'
            })
            .where(where);
        let authList = think.isEmpty(page) ?
            await authListSql.select() :
            await authListSql.page(page, size).countSelect();
        return that.json(httpRes.suc(authList))
    }

    /*
    * 权限
    *   获取详情
    * */
    async get_auth_infoAction() {
        let that = this;
        let {auth_id} = that.post();
        if (think.isEmpty(auth_id)) return that.json(httpRes.errArgumentMiss);
        let auth = await that.model(MODEL.TABLE.ADMIN_AUTH)
            .field(`
                ${MODEL.TABLE.ADMIN_AUTH}.id as auth_id,
                ${MODEL.TABLE.ADMIN_AUTH}.name as auth_name,
                ${MODEL.TABLE.ADMIN_AUTH}.group_name as auth_group_name,
                ${MODEL.TABLE.ADMIN_AUTH}.parent_id as auth_parent_id,
                ${MODEL.TABLE.ADMIN_AUTH}.sort as auth_sort,
                ${MODEL.TABLE.ADMIN_AUTH}.type as auth_type,
                ${MODEL.TABLE.ADMIN_AUTH}.router as auth_router
            `)
            .where({[`${MODEL.TABLE.ADMIN_AUTH}.id`]: auth_id})
            .find();
        if (think.isEmpty(auth)) return that.json(httpRes.err('该权限不存在'));
        return that.json(httpRes.suc(auth));
    }

    /*
    * 权限
    *   修改信息
    * */
    async edit_auth_infoAction() {
        let that = this;
        let {auth_id, auth_name, auth_group_name, auth_type, auth_sort, auth_parent_id, auth_router} = that.post();
        if (think.isEmpty(auth_name) || think.isEmpty(auth_type)) return that.json(httpRes.errArgumentMiss);
        let handleData = {
            name: auth_name,
            group_name: auth_group_name,
            type: auth_type,
            sort: auth_sort,
            parent_id: auth_parent_id || -1,
            router: auth_router
        };
        if (auth_id) {
            // 修改权限信息
            let updateRow = await that.model(MODEL.TABLE.ADMIN_AUTH)
                .where({id: auth_id})
                .update(handleData)
        } else {
            // 添加权限信息
            auth_id = await that.model(MODEL.TABLE.ADMIN_AUTH)
                .add(handleData);
        }
        return that.json(httpRes.suc());
    }

    /*
    * 权限
    *   删除
    * */
    async delete_auth_infoAction() {
        let that = this;
        let {auth_id} = that.post();
        if (think.isEmpty(auth_id)) return that.json(httpRes.errArgumentMiss);
        await that.model(MODEL.TABLE.ADMIN_AUTH).where({id: auth_id}).delete();
        await that.model(MODEL.TABLE.ADMIN_ROLE_AUTH).where({auth_id: auth_id}).delete();
        return that.json(httpRes.suc());
    }

    /*
    * 常量
    *   列表
    * */
    async get_constant_listAction() {
        let that = this;
        let {page, size = 20} = that.get();
        let {key, desc} = that.post();
        let where = {};
        if (!think.isEmpty(key)) where[`${MODEL.TABLE.ADMIN_CONSTANT}.key`] = ['like', `%${key}%`];
        if (!think.isEmpty(desc)) where[`${MODEL.TABLE.ADMIN_CONSTANT}.desc`] = ['like', `%${desc}%`];
        let constantListSql = await that.model(MODEL.TABLE.ADMIN_CONSTANT)
            .field(`
                ${MODEL.TABLE.ADMIN_CONSTANT}.id as constant_id,
                ${MODEL.TABLE.ADMIN_CONSTANT}.desc as constant_desc,
                ${MODEL.TABLE.ADMIN_CONSTANT}.content as constant_content,
                ${MODEL.TABLE.ADMIN_CONSTANT}.key as constant_key
            `)
            .order({
                [`${MODEL.TABLE.ADMIN_CONSTANT}.id`]: 'asc'
            })
            .where(where);
        let authList = think.isEmpty(page) ?
            await constantListSql.select() :
            await constantListSql.page(page, size).countSelect();
        return that.json(httpRes.suc(authList))
    }

    /*
   * 常量
   *   获取详情
   * */
    async get_constant_infoAction() {
        let that = this;
        let {constant_id, constant_key} = that.post();
        let where = {};
        if (!think.isEmpty(constant_id)) where[`${MODEL.TABLE.ADMIN_CONSTANT}.id`] = constant_id;
        if (!think.isEmpty(constant_key)) where[`${MODEL.TABLE.ADMIN_CONSTANT}.key`] = constant_key;
        if (think.isEmpty(where)) return that.json(httpRes.errArgumentMiss);
        let auth = await that.model(MODEL.TABLE.ADMIN_CONSTANT)
            .field(`
                ${MODEL.TABLE.ADMIN_CONSTANT}.id as constant_id,
                ${MODEL.TABLE.ADMIN_CONSTANT}.desc as constant_desc,
                ${MODEL.TABLE.ADMIN_CONSTANT}.content as constant_content,
                ${MODEL.TABLE.ADMIN_CONSTANT}.key as constant_key
           `)
            .where(where)
            .find();
        if (think.isEmpty(auth)) return that.json(httpRes.err('该常量不存在'));
        return that.json(httpRes.suc(auth));
    }

    /*
   * 常量
   *   修改信息
   * */
    async edit_constant_infoAction() {
        let that = this;
        let {constant_id, constant_desc, constant_content, constant_key} = that.post();
        if (think.isEmpty(constant_content) || think.isEmpty(constant_key)) return that.json(httpRes.errArgumentMiss);
        let handleData = {
            key: constant_key,
            desc: constant_desc,
            content: constant_content
        };
        if (constant_id) {
            // 修改权限信息
            let updateRow = await that.model(MODEL.TABLE.ADMIN_CONSTANT)
                .where({id: constant_id})
                .update(handleData)
        } else {
            // 添加权限信息
            constant_id = await that.model(MODEL.TABLE.ADMIN_CONSTANT)
                .add(handleData);
        }
        return that.json(httpRes.suc());
    }
}