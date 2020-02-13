import { cloneDeep, isString, flow, curry } from 'lodash';
import umiRouter from 'umi/router';
import Cookies from "ts-cookies";
import axios from "axios";
import {SetControls, CloseControls} from ".././components/Layout/Control"
import {secretOrKey} from "../../config/keys.js"
import * as antd from "antd"

import * as lib from'./libs.js'
export * from "./libs.js"

var react = require("react");
var package_json = require("../../package.json");
var jquery = require("jquery");
var config = require("config");
var utils = require("utils");
var { router } = require("utils")
var jwt = require("jsonwebtoken")

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
export function InitSocket(id, params){
    console.log('Starting socket with _id: ', id)
    const defaultParams = {fullscreen: true, collapse: true}
    let globalParm;

    if (!params) {
        globalParm = defaultParams;
    }else{
        globalParm = params;
    }
    
    if (id) {
        console.log(globalParm)
        globalParm.fullscreen? requestFullscreen() : null;
        globalParm.collapse? null : null;
        Cookies.set('inApp', true)
        router.push({pathname: `/socket/${id}`,})
    }
    else{
        console.error('Failure starting the app... Invalid or Missing ID')
    }
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
export const asyncSDCP = {
    setSDCP: function (value) {
        return Promise.resolve().then(function () {
            sessionStorage.setItem('SDCP', value);
        });
    },
    getSDCP: function () {
        return sessionStorage.getItem('SDCP');
    }
};
export const ControlBar = {
    set: (e) => {
        SetControls(e)
    },
    close: () => {
        CloseControls()
    }
}
export function SyncSocketAccount(title, socket, logo) {
    DevOptions.ShowFunctionsLogs? console.log('Initialising auth for ', title) : null
    const signkey = secretOrKey;
    const ExpireTime = '300';
    const key = {title, socket, logo}
    const ckey = jwt.sign(
        key,
        signkey,
        { expiresIn: ExpireTime },
    )
    DevOptions.ShowFunctionsLogs? console.log(key, jwt.decode(ckey)) : null
    asyncLocalStorage.setItem('AUTHRES', ckey).then(
     window.open('/ec/authorize', title, "height=589,width=511")
    )
}
export function GetAuthSocket(sc, values) {
    const prefix = '[YID Sync]'
    if (!sc) {
        DevOptions.ShowFunctionsLogs? console.warn(prefix, 'Socket API missing!') : null
        return
    }
    const PayloadData = new FormData();
    PayloadData.append("server_key", yConfig.server_key);
}
export function ValidLoginSession(){
    const prefix = '[YID Session]';
    let final = false;
    let ValidCookiesToken = false;
    let ValidSDCP = false;
    let TokenContainer = Cookies.get('token');
    let SDCPContainer = asyncSDCP.getSDCP();
    if (TokenContainer) {
      let TokenContainerDC = jwt.decode(TokenContainer)
      if (TokenContainerDC){
        ValidCookiesToken = true
      }
    }
    if (SDCPContainer) {
        try {
            let SDCPContainerDC = atob(SDCPContainer)
            ValidSDCP = true 
        } catch (error) {
            return
        }
    }
    if (ValidCookiesToken == true  && ValidSDCP == true) {final = true} 
    DevOptions.ShowFunctionsLogs? (
        console.group(`%c ${prefix} `, 'background: #339edf; color: #fff'),
        console.log(`Valid SDCP => ${ValidSDCP}`),
        console.log(`Valid Token => ${ValidCookiesToken}`),
        console.log(`Session is valid => ${final}`),
        console.groupEnd() 
    ) : null
    return final
}
export function ValidBackup(){
    const prefix = '[YID SessionState]';
    let ValidBackupToken = false;
    let LastestToken = localStorage.getItem('last_backup');
    if (LastestToken) {
        let LastestTokenDC = jwt.decode(LastestToken)
        if (LastestTokenDC){
              ValidBackupToken = true
        }
    }
    return ValidBackupToken;
}
export function MakeBackup(){
    if (ValidBackup() == false) {
        asyncLocalStorage.setItem('last_backup', Cookies.get('token'))
        return
    }
}
export function LogoutCall(){
    const prefix = ('[YID Session]  ')
    console.log('Logout Called !')
    let DecodedToken = GetUserToken.decrypted().userToken
    if (DecodedToken == false) {
        antd.notification.open({
            placement: 'topLeft',
            message: 'Unexpectedly failed logout in YulioID™ ',
            description: 'It seems that your token has been removed unexpectedly and could not log out from YulioID ',
            icon: <antd.Icon type="warning" style={{ color: 'orange' }} />
        })
        router.push({pathname: '/login',})
        return 
    }
    const urlOBJ = "" + endpoints.removeToken + DecodedToken;
    DevOptions.ShowFunctionsLogs? console.log(prefix, ' Login out with token => ', DecodedToken, urlOBJ) : null
    const form = new FormData();
    form.append("server_key", yConfig.server_key);
    const settings = {
        "url": urlOBJ,
        "method": "POST",
        "timeout": 0,
        "processData": false,
        "mimeType": "multipart/form-data",
        "contentType": false,
        "data": form
    };
    jquery.ajax(settings)
    .done((response) => {
        const api_state = JSON.parse(response)['api_status']
        console.log(`Exit with => ${api_state}`)
        if (api_state == '404') {
            antd.notification.open({
                placement: 'topLeft',
                message: 'Unexpectedly failed logout in YulioID™ ',
                description: 'It seems that your token has been removed unexpectedly and could not log out from YulioID ',
                icon: <antd.Icon type="warning" style={{ color: 'orange' }} />
              })
        }
        else {
            console.log("Successful logout in YulioID™", response, urlOBJ)
        }
        // Runtime after dispatch API
        sessionStorage.clear() 
        Cookies.remove('token')
        router.push({pathname: '/login',})
    })
}
export function GetAuth(EncUsername, EncPassword, callback) {
    const prefix = '[Auth Server]:';
    if (!EncUsername || !EncPassword) {
        const message = 'Missing Data! Process Aborted...';
        console.log(prefix, message);
    }
    const server_key = yConfig.server_key;
    let username = atob(EncUsername);
    let password = atob(EncPassword);
    const form = new FormData();
    form.append("server_key", server_key);
    form.append("username", username);
    form.append("password", password);
    const settings = {
        "url":  endpoints.auth_endpoint,
        "method": "POST",
        "timeout": 0,
        "processData": false,
        "mimeType": "multipart/form-data",
        "contentType": false,
        "data": form
    };
    jquery.ajax(settings)
        .done(function (response) {
        console.log(prefix, 'Server response... Dispathing data to login API...');
        return callback(null, response);
    })
        .fail(function (response) {
        const exception = new Error("Server failed response . . . :( ");
        return callback(exception, response);
    })
}
export const GetUserToken = {
    decrypted: function () {
        let final = jwt.decode(Cookies.get('token')) || jwt.decode(localStorage.getItem('last_backup'));
        const FC = jwt.decode(Cookies.get('token'))
        const FB = jwt.decode(localStorage.getItem('last_backup'))
        if (!FC && !FB) {
            final = false
            return final
        }
        if (!FC) {
            final = FB
        }
        if (!FB) {
            final = FC
        }
        console.log(final)
        return final
    },
    raw: function () {
        return Cookies.get('token') || localStorage.getItem('last_backup');
    }
}
export function GetUserData (values, customPayload, callback) {
    const prefix = '[YID SDCP]';
    const request = 'user_data' || customPayload;
    const globalValue = values || GetUserToken.decrypted();
    const usertoken = globalValue.UserToken
    const userid = globalValue.UserID
    if (!globalValue) {
        const message = 'Missing payload! Exception while request data... Maybe the user is not login';
        DevOptions.ShowFunctionsLogs? console.log(prefix, message) : null
        return;
    }
    const ApiPayload = new FormData();
    ApiPayload.append("server_key", yConfig.server_key);
    ApiPayload.append("fetch", request);
    ApiPayload.append("user_id", userid);
    const uri = endpoints.get_userData_endpoint;
    const urlOBJ = "" + uri + usertoken;
    const settings = {
        "url": urlOBJ,
        "method": "POST",
        "timeout": 0,
        "processData": false,
        "mimeType": "multipart/form-data",
        "contentType": false,
        "data": ApiPayload
    }
    jquery.ajax(settings)
      .done(
         function (response) {
           let resString = JSON.stringify(response);
           let resParsed = JSON.parse(resString);
           DevOptions.ShowFunctionsLogs ? console.log(prefix, 'Fechted user data...' ) : null
           callback( resParsed )
           return resParsed
        }
       )
      .fail(
         function (response) {
            DevOptions.ShowFunctionsLogs ? console.log(prefix, 'Server failure!', response) : null
            callback( null )
            return
        }
     )
}
export function InitSDCP(values, done) {
     const prefix = '[InitSDCP]';
     let payload = {};
     if (!values) {
         const message = 'Missing payload! Exception while request data...';
         DevOptions.ShowFunctionsLogs? console.log(prefix, message) : null
         return;
     }
     payload.UserToken = values.UserToken;
     payload.UserID = values.UserID;
     if (payload) {
         GetUserData(payload, {}, (callback) => 
           { 
             let cooked = JSON.parse(callback)['user_data']
             let Ensamblator = btoa(JSON.stringify(cooked))
             asyncSDCP.setSDCP(Ensamblator).then(() => {
                DevOptions.ShowFunctionsLogs? console.log(prefix, ' SDCP Setup done') : null
                return done(true)
            })
           }
         )
     }
}
export function UpdateSDCP() {
    const prefix = '[UpdateSDCP]';
    GetUserData(null, null, (callback) => {
        let cooked = JSON.parse(callback)['user_data']
        let Lsdcp = [atob(sessionStorage.getItem('SDCP'))];
        let Nsdcp = [JSON.stringify(cooked)]
        const e1 = btoa(Lsdcp)
        const e2 = btoa(Nsdcp)
        const n = e1.localeCompare(e2)
        if (e1 == e2) {
            console.log(prefix, 'SDCP Equality')
        }else{
            DevOptions.ShowFunctionsLogs? console.log(prefix, 'SDCP Update detected ! => ', n) : null
            asyncSDCP.setSDCP(e2)
        }
    })
}
export function SDCP() {
    const prefix = '[SDCPCooker]';
    let SDCPContainer = sessionStorage.getItem('SDCP')
    if (SDCPContainer) {
        try {
            let decodedSDCP = atob(SDCPContainer);
        } catch (err) {
            console.error(prefix, err)
            router.push({pathname: '/login',})
            return null
        }
        try {
            let decodedSDCP = atob(SDCPContainer);
            let parsedSDCP = JSON.parse(decodedSDCP);
            return parsedSDCP;
        } catch (err) {
            console.error(prefix, err)  
            router.push({pathname: '/login',})
            return null
        }
    }
}
export function PushUserData(inputIO1, inputIO2) {
    var getStoragedToken = Cookies.get('access_token');
    var _this = this;
    var yCore_GUDEP = endpoints.update_userData_endpoint;
    var urlOBJ = "" + yCore_GUDEP + getStoragedToken;
    DevOptions.ShowFunctionsLogs? console.log('Recived', global, 'sending to ', urlOBJ) : null
    var form = new FormData();
    form.append("server_key", yConfig.server_key);
    form.append(inputIO1, inputIO2);
    var settings = {
        "url": urlOBJ,
        "method": "POST",
        "timeout": 0,
        "processData": false,
        "mimeType": "multipart/form-data",
        "contentType": false,
        "data": form
    };
    jquery.ajax(settings).done(function (response) {
        DevOptions.ShowFunctionsLogs? console.log(response) : null
    });
}
export function GetGlobalMarketplaceSource() {
    let global;
    let TokenContainer = Cookies.get('token') || localStorage.getItem('last_backup');
    let DecodedToken = jwt.decode(TokenContainer)
    let usertoken = DecodedToken.UserToken;
    const uri = endpoints.get_marketplace_global;
    const urlOBJ = "" + uri + usertoken;
    (async () => {
        const response = await axios({
          url: urlOBJ,
          method: 'get'
        })  
        global = response.data
        console.log(response.data, global)
        return {global};
      })()
}
export function DetectNoNStableBuild(e1) {
    switch (e1) {
        case 'TagComponent':
            if (package_json.DevBuild == true) {
                return react.createElement(antd.Tag, { color: 'orange' }, " No Stable");
            }
            if (package_json.DevBuild == false) {
                return react.createElement(antd.Tag, { color: 'blue' }, " Stable");
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
export function RefreshONCE(){
 window.location.reload(); 
}

