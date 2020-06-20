import {MODEL} from "../lib/config";

module.exports = {
    // 保存日志
    async saveOfficialUserLog(info, updateUserStatus = true) {
        let that = this;
        if (think.isEmpty(info)) return;
        let newTime = new Date().getTime();
        // 添加日志记录
        await that
            .model(MODEL.TABLE.OFFICIAL_USER_LOG)
            .add(think.extend(info, {add_time: newTime}));
        if (updateUserStatus) {
            // 修改最后操作记录
            await that
                .model(MODEL.TABLE.OFFICIAL_USER)
                .where({openid: info.openid})
                .update({last_operation_time: newTime, last_operation_type: info.type})
        }
    }
}