/*
* 工具相关
* */

const sha1 = require('sha1');
const fs = require('fs');
const request = require('request')
export const getTimestamp = () => parseInt(Date.now() / 1000);
export const getNonceStr = () => Math.random().toString(36).substr(2, 15);
export const getSignature = (params) => sha1(Object.keys(params).sort().map(key => `${key.toLowerCase()}=${params[key]}`).join('&'));
export const downloadFile = (url, fileName) => {
    return new Promise((resolve) => {
        request(url).pipe(fs.createWriteStream(`temp_upload/${fileName}`).on('close', err => {
            if (err) return resolve({code: 1, msg: err});
            resolve({code: 0, data: {path: `temp_upload/${fileName}`}});
        }))
    })
}
export const unlinkFile = (url) => {
    return new Promise((resolve) => {
        fs.unlink(url, function (err) {
            if (err) return resolve({code: 1, msg: err})
            resolve({code: 0})
        })
    })
}
export const httpRes = {
    suc: function (data = null) {
        return {code: 0, msg: '请求成功', data: data}
    },
    err: function (msg = '', code = 1) {
        return {code: code, msg: msg, data: null}
    },
    redirectLink: function (link) {
        return {code: 301, msg: '请求跳转', data: link}
    },
    errLoginBeOverdue: {code: 401, msg: '登录信息过期', data: null},
    errNoResult: {code: 1, msg: '找不到结果', data: null},
    errArgumentMiss: {code: 1, msg: '提交信息有误', data: null},
    errSysBusy: {code: 1, msg: '系统繁忙', data: null},
    errNoDataHasUpdate: {code: 1, msg: '数据变更失败', data: null}
}