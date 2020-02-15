import React from 'react'
import {AppSettings} from  '../../globals/settings.js'
import {Endpoints} from 'globals/endpoints.js'
import umiRouter from 'umi/router';
import * as antd from "antd"
import config from 'config'
import './libs.js'

export * from "./libs.js"
export * from "../../config/app.settings.js"
export var { router } = require("utils")
export var endpoints = Endpoints;
export var yConfig = config.yConfig;

var package_json = require("../../package.json");
export const AppInfo = {
    name: package_json.title,
    version: package_json.version,
    logo: config.FullLogoPath
}
export function ReturnDevOption(e){
    const Ite = AppSettings.map(item => {
      return item.SettingID === e? item.value : null
    })
    const fr = Ite.filter(Boolean)
    return fr.toString()
}

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
export function DetectNoNStableBuild(e1) {
    switch (e1) {
        case 'TagComponent':
            if (package_json.DevBuild == true) {
                return React.createElement(antd.Tag, { color: 'orange' }, " No Stable");
            }
            if (package_json.DevBuild == false) {
                return React.createElement(antd.Tag, { color: 'blue' }, " Stable");
            }
            else {
                return ('No Stable');
            }
            break;
        default:
            if (package_json.DevBuild == true) {
                return ('No Stable');
            }
            if (package_json.DevBuild == false) {
                return ('Stable');
            }
            else {
                return ('No Stable');
            }
            break;
    }
}
