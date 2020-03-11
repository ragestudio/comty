/**
 *    @yCore_Worker
 * 
 * @author rStudio© 2020
 * @licensed Pending...
 */

import React from "react";
import {AppSettings} from  "../../globals/settings.js";
import {Endpoints} from "globals/endpoints.js";
import umiRouter from "umi/router";
import * as antd from "antd";
import * as Icons from '@ant-design/icons';

import config from "config"
import "./libs.js"

export * from "./libs.js"
export * from "../../config/app.settings.js"

export var { router } = require("utils")
export var endpoints = Endpoints;
export var yConfig = config.yConfig;

var package_json = require("../../package.json");

/**
 * Convert a base64 string in a Blob according to the data and contentType.
 * 
 * @param b64Data {String} Pure base64 string without contentType
 * @param contentType {String} the content type of the file i.e (image/jpeg - image/png - text/plain)
 * @param sliceSize {Int} SliceSize to process the byteCharacters
 * @return Blob
 */
export function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

  var blob = new Blob(byteArrays, {type: contentType});
  return blob;
}
export function objectLast(array, n) {
    if (array == null) 
      return void 0;
    if (n == null) 
       return array[array.length - 1];
    return array.slice(Math.max(array.length - n, 0));  
};
export function gotoBottom(id){
    const element = document.getElementById(id);
    element.scrollTop = element.scrollHeight - element.clientHeight;
}
export function gotoElement(element){   
     document.getElementById(element).scrollIntoView();   
}

/**
 * Return parsed some information about this App
 * 
 * @return {object}
 */
export const AppInfo = {
    name: package_json.title,
    version: package_json.version,
    logo: config.FullLogoPath,
    logo_dark: config.DarkFullLogoPath
}

/**
 * Convert the localStorage values (AppSettings) parsed
 * 
 * @param e {String} String of SettingID for search
 * @return {string} Boolean value
 */
export function StorageValued(e){
    try {
      const fromStorage = JSON.parse(localStorage.getItem('app_settings'))
      const Ite = fromStorage.map(item => {
        return item.SettingID === e? item.value : null
      })
      const fr = Ite.filter(Boolean)
      return fr.toString()
    } 
    catch (error) {
      return null
    }
}

/**
 * Return the values as alias (AppSettings, DevOptions)
 * 
 * @param e {String} String of SettingID for search
 * @return {string} Boolean value
 */
export function ReturnDevOption(e){
    const Ite = AppSettings.map(item => {
      return item.SettingID === e? item.value : null
    })
    const fr = Ite.filter(Boolean)
    return fr.toString()
}

/**
 * Global fix for convert '1, 0' to string boolean 'true, false'
 * 
 * @param e {int} Numeric boolean reference
 * @return {bool} Boolean value
 */
export function booleanFix(e){
    if(e == 1){
        return true
    }
    return false
}

/**
 * Framework functionality for navigate between pages (Router)
 * 
 */
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
/**
 * Render User Notification about an Error
 * 
 * @param err {String} String of error for show
 */
export function notifyError(err){
    antd.notification.error({
        message: 'Wopss',
        description: (<div><span>An wild error appear! : </span><br/><br/><div style={{ position: 'absolute', width: '100%',backgroundColor: 'rgba(243, 19, 19, 0.329)', bottom: '0', color: 'black', padding: '3px' }} >{err.toString()}</div></div>),
        placement: 'bottomLeft'
    })
}
/**
 * Render User Notification about an proccess
 * 
 * @param cust {String} String of proccess for show
 */
export function notifyProccess(cust){
    antd.notification.open({
        icon: <Icons.LoadingOutlined style={{ color: '#108ee9' }} />,
        message: 'Please wait',
        description: (<div>{cust}</div>),
        placement: 'bottomLeft'
    })
}
/**
 * Request FullScreen mode
 * 
 */
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
/**
 * Async get/set localStorage method
 * 
 * @param key {string} String for search
 * @param value {string} Value for set
 * @return {any} An callback for async/await
 */
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
/**
 * Async get/set sessionStorage method
 * 
 * @param key {string} String for search
 * @param value {string} Value for set
 * @return {any} An callback for async/await
 */
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
/**
 * Request browser for refresh the windows 
 * 
 */
export function RefreshONCE(){
 window.location.reload(); 
}
/**
 * Parse information about this App
 * 
 * @param e1 {string} Declare type
 * @return {any} JSX Component / Object information
 */
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
/**
 * User console with setting user permissions
 * 
 * @param ... {any} Use for type of console
 */
export const yconsole = {
    log: (...cont)=>{
        ReturnDevOption('force_showDevLogs')? console.log(...cont) : null
        return
    },
    debug: (...cont)=>{
        ReturnDevOption('force_showDevLogs')? console.debug(...cont) : null
        return
    },
    error: (...cont)=>{
        ReturnDevOption('force_showDevLogs')? console.error(...cont) : null
        return
    },
    warn: (...cont)=>{
        ReturnDevOption('force_showDevLogs')? console.warn(...cont) : null
        return
    }
}