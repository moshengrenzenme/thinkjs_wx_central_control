// 微信公众号服务端对接

import {getConfigById} from "../api/wechat.official";

module.exports = class extends think.Controller {

    /*
    * 文字消息
    * 接收微信服务器推送的文字内容
    * */
    async textAction() {
        let that = this;
        let {signature, timestamp, nonce, openid} = that.get();
        let {ToUserName, FromUserName, CreateTime, MsgType, Content, MsgId} = that.post();
        return that.success('')
    }

    /*
    * 事件消息
    * 接收微信服务器推送的事件内容
    * */
    async eventAction() {
        let that = this;
        let {signature, timestamp, nonce, openid} = that.get();
        let {
            ToUserName, FromUserName, CreateTime, MsgType, Event, EventKey, Ticket, Latitude, Longitude, Precision
            ScanCodeInfo, ScanType, ScanResult
        } = that.post();
        switch (Event) {
            case 'subscribe':// 关注
                console.log('用户关注了');
                break;
            case 'unsubscribe':// 取消关注
                console.log('用户取消关注了');
                break;
            case 'SCAN':// 用户已关注后扫码
                break;
            case 'LOCATION':// 地理位置
                break;
            case 'TEMPLATESENDJOBFINISH':// 模版消息发送完毕
                break;
            case 'CLICK':// 点击菜单 => 拉取消息
                break;
            case 'VIEW':// 点击菜单 => 跳转链接
                break;
            case 'view_miniprogram': // 点击菜单 => 跳转小程序的事件推送
                break;
            case 'scancode_push': // 扫码推事件的事件推送
                break;
            case 'scancode_waitmsg': // 扫码推事件的事件推送
                break;
            case 'pic_sysphoto': // 扫码推事件且弹出“消息接收中”提示框的事件推送
                break;
            case 'pic_photo_or_album': // 弹出拍照或者相册发图的事件推送
                break;
            case 'pic_weixin': // 弹出微信相册发图器的事件推送
                break;
            case 'location_select': // 弹出地理位置选择器的事件推送
                break;
        }
        return that.success('')
    }

    /*
    * 图片消息
    * 接收微信服务器推送的图片内容
    * */
    async imageAction() {
        let that = this;
        let {signature, timestamp, nonce, openid} = that.get();
        let {ToUserName, FromUserName, CreateTime, MsgType, PicUrl, MsgId, MediaId} = that.post();
        return that.success('')
    }

    /*
    * 语音消息
    * 接收微信服务器推送的语音内容
    * */
    async voiceAction() {
        let that = this;
        let {signature, timestamp, nonce, openid} = that.get();
        let {ToUserName, FromUserName, CreateTime, MsgType, Recognition, MsgId, MediaId, Format} = that.post();
        return that.success('')
    }

    // 前置函数
    async __before() {
        let that = this;
        let {id} = that.get();
        that.wechatInfo = await getConfigById(id);
        if (think.isEmpty(that.wechatInfo)) return that.success('')
    }

    // 如果没找到默认回复
    __call() {
        this.success('')
    }
};
