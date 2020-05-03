import {MODEL} from "../lib/config";

module.exports = {
    // 保存日志
    async saveOfficialUserLog(info) {
        let that = this;
        if (think.isEmpty(info)) return;
        await that.model(MODEL.TABLE.OFFICIAL_USER_LOG).add(think.extend(info, {
            add_time: new Date().getTime()
        }))
    }
}