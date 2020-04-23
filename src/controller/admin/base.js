import {ADMIN_LOGIN_SESSION_NAME, ADMIN_API_NOT_AUTH} from "../../lib/config";
import {httpRes} from "../../lib/utils";

module.exports = class extends think.Controller {
    // 接口过滤器
    async __before() {
        let that = this;
        let requestUrl = that.ctx.request.url;
        if (!ADMIN_API_NOT_AUTH.includes(requestUrl)) {
            let selfInfo = await that.session(ADMIN_LOGIN_SESSION_NAME);
            if (think.isEmpty(selfInfo)) return that.json(httpRes.err('请先登录再操作'))
            that.selfInfo = selfInfo;
        }
    }
}