/*
* 工具相关
* */

const oss = require('ali-oss');
const sha1 = require('sha1');
const fs = require('fs');
const request = require('request');
const xlsx = require('node-xlsx');

export const getTimestamp = () => parseInt(Date.now() / 1000);
export const getNonceStr = () => Math.random().toString(36).substr(2, 15);
export const getSignature = (params) => sha1(Object.keys(params).sort().map(key => `${key.toLowerCase()}=${params[key]}`).join('&'));

// 上传文件到阿里云oss
export const uploadOss = async (cfg, path) => {
    const ossClient = new oss({
        accessKeyId: cfg.access_key,
        accessKeySecret: cfg.accessKey_secret,
        bucket: cfg.bucket,
        region: cfg.region
    });
    let result = await ossClient.put(`/${path}`, path).catch(err => err);
    unlinkFile(path);
    return result;
}
// 下载网络文件
export const downloadFile = (url, fileName) => {
    return new Promise((resolve) => {
        request(url).pipe(fs.createWriteStream(`temp_upload/${fileName}`).on('close', err => {
            if (err) return resolve({code: 1, msg: err});
            resolve({code: 0, data: {path: `temp_upload/${fileName}`}});
        }))
    })
}
// 删除本地文件
export const unlinkFile = (path) => {
    return new Promise((resolve) => {
        fs.unlink(path, function (err) {
            if (err) return resolve({code: 1, msg: err})
            resolve({code: 0})
        })
    })
}
// 生成excel
export const createdExcel = async (option) => {
    let excel_data = new Array();
    let headers_data = new Array();
    for (var i = 0; i < option.data.length; i++) { //行
        excel_data[i] = new Array();//列
        for (var j = 0; j < option.fields.length; j++) {
            if (!headers_data.includes(option.fields[j].field_name)) headers_data.push(option.fields[j].field_name);
            let data = option.data[i][option.fields[j].field_id];
            if (option.fields[j].format) data = option.fields[j].format(data, option.data[i]);
            excel_data[i][j] = data;
        }
    }
    excel_data.unshift(headers_data);
    let file_name = 'temp_upload/' + new Date().getTime() + ".xlsx";
    let path = file_name;
    let buffer = await xlsx.build([{name: "sheet1", data: excel_data}])
    await fs.writeFileSync(path, buffer)
    return file_name
}
// 响应
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