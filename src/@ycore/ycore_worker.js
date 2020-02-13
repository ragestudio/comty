import umiRouter from 'umi/router';
import * as antd from "antd"

import './libs.js'
export * from "./libs.js"

var package_json = require("../../package.json");
var config = require("config");

export var { router } = require("utils")
export var endpoints = config.Endpoints;
export var DevOptions = config.DevOptions;
export var yConfig = config.yConfig;

export function booleanFix(e){
    if(e == 1){
        return true
    }
    return false
}
export const crouter = {
    native: (e) =>{
        umiRouter.push({
            pathname: `/${e}`,
            search: window.location.search,
          });
    },
    default: (e) =>{
        router.push(e)
    }
}
export function notifyError(err){
    antd.notification.error({
        message: 'Wopss',
        description: (<div><span>An wild error appear! : </span><br/><br/><div style={{ position: 'absolute', width: '100%',backgroundColor: 'rgba(243, 19, 19, 0.329)', bottom: '0', color: 'black', padding: '3px' }} >{err.toString()}</div></div>),
        placement: 'bottomLeft'
    })
}
export function notifyProccess(cust){
    antd.notification.open({
        icon: <antd.Icon type="loading" style={{ color: '#108ee9' }} />,
        message: 'Please wait',
        placement: 'bottomLeft'
    })
}
export function requestFullscreen(){
    var elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
      elem.msRequestFullscreen();
    }
}
export const asyncLocalStorage = {
    setItem: function (key, value) {
        return Promise.resolve().then(function () {
            localStorage.setItem(key, value);
        });
    },
    getItem: function (key) {
        return Promise.resolve().then(function () {
            return localStorage.getItem(key);
        });
    }
};
export const asyncSessionStorage = {
    setItem: function (key, value) {
        return Promise.resolve().then(function () {
            sessionStorage.setItem(key, value);
        });
    },
    getItem: function (key) {
        return Promise.resolve().then(function () {
            return sessionStorage.getItem(key);
        });
    }
};
export function RefreshONCE(){
 window.location.reload(); 
}

