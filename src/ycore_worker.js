import Cookies from "ts-cookies";
import axios from "axios";
import {SetControls, CloseControls} from "./components/Layout/Control"
import {secretOrKey} from "../config/keys.js"
import * as antd from "antd"
import { func } from "prop-types";

var react = require("react");
var package_json = require("../package.json");
var jquery = require("jquery");
var uifx = require("uifx");
var config = require("config");
var utils = require("utils");
var { router } = require("utils")
var  jwt  = require("jsonwebtoken")

export var endpoints = config.Endpoints;
export var DevOptions = config.DevOptions;
export var yConfig = config.yConfig;

export const ycore_worker = {
    ServerVersion: package_json.version,
    ServerType: package_json.VersionPhase,
    FXapiProvider: 'https://api.ragestudio.net/RS-YIBTP/lib/uiFXProvider/'
};

export const about_this = {
    Service_name: package_json.name,
    Version: package_json.version,
    Description: package_json.description,
    Branding: package_json.copyright,
    Licensing: package_json.license,
    // Temporaly added from yConfig
    logotype_uri: 'https://api.ragestudio.net/branding/lib/RDSeries-Branding/rDashboard/BLACK/SVG/T3/rDashboard-FullTextBlack-TM-T3.svg',
    Phase: package_json.VersionPhase
};
export const UIFxList = {
    notifyDefault: (ycore_worker.FXapiProvider + 'NotifyDefault.wav'),
    notifyWarning: (ycore_worker.FXapiProvider + 'NotifyWarning.wav'),
    notifySuccess: (ycore_worker.FXapiProvider + 'notifySuccess.wav')
};
export const infoServer = (ycore_worker.ServerType + ' Server | v' + ycore_worker.ServerVersion);

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
export function GetFeedPosts(callback) {
    let formdata = new FormData();
    formdata.append("server_key", yConfig.server_key);
    formdata.append("type", "get_news_feed");

    const requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow'
    };
    const objUrl = `${endpoints.get_userPostFeed}${GetUserToken.decrypted().UserToken}`
    console.log(objUrl)
    fetch(objUrl, requestOptions)
      .then(response => response.text())
      .then(result => {
       return callback( null, result)
      })
      .catch(error => console.log('error', error));

}

export const get_app_session = {
    get_id: (callback) => {
      const fromSto = sessionStorage.getItem('se_src')
      if (!fromSto){
        DevOptions.ShowFunctionsLogs? console.log("Missing session_id, setting up...") : null
        let formdata = new FormData();
        formdata.append("server_key", yConfig.server_key);
        formdata.append("type", "get");
        const requestOptions = {
          method: 'POST',
          body: formdata,
          redirect: 'follow'
        };
        const uriObj = `${endpoints.get_sessions}${GetUserToken.decrypted().UserToken}`
        notifyProccess()
        fetch(uriObj, requestOptions)
          .then(response => response.text())
          .then(result => {
            const pre = JSON.stringify(result)
            const pre2 = JSON.parse(pre)
            const pre3 = JSON.stringify(JSON.parse(pre2)["data"])
  
            const obj = JSON.parse(pre3)["session_id"]
            
           return asyncSessionStorage.setItem('se_src', btoa(obj)).then( callback(null, obj) )
          
          })
        .catch(error => console.log('error', error));
      }
        DevOptions.ShowFunctionsLogs? console.log("Returning from storage") : null
        return callback( null, atob(fromSto) )
    },
    raw: (callback) => {
        const formdata = new FormData();
        formdata.append("server_key", yConfig.server_key);
        formdata.append("type", "get");

        const requestOptions = {
          method: 'POST',
          body: formdata,
          redirect: 'follow'
        };
        const uriObj = `${endpoints.get_sessions}${GetUserToken.decrypted().UserToken}`
        fetch(uriObj, requestOptions)
          .then(response => response.text())
          .then(result => {
            const pre = JSON.stringify(result)
            const parsed = JSON.parse(pre)
            const obj = JSON.parse(parsed)["data"]
            DevOptions.ShowFunctionsLogs? console.log(result, obj) : null
            return callback(null, obj)
          })
        .catch(error => console.log('error', error));
    }

 
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
    setCreate: (e) =>{

    },
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
    let DecodedToken = GetUserToken.decrypted()
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
    const urlOBJ = "" + endpoints.removeToken + DecodedToken.UserToken;
    DevOptions.ShowFunctionsLogs? console.log(prefix, ' Login out with token => ', DecodedToken.UserToken, urlOBJ) : null
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
    .done( (response) => {
        const url = '/api/v1/user/logout'
        const method = 'GET'
        utils.request({method, url})
        sessionStorage.clear() 
        console.log("Successful logout in YulioID™", response, urlOBJ)    
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
    });
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
};

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
    };
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
     );
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
            });
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


//*              *//
//*   Helpers    *//
//*              *//
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

export function getRandomBG(imgAr) {
    var path = 'https://api.ragestudio.net/RS-YIBTP/lib/statics/heros/';
    var num = Math.floor(Math.random() * imgAr.length);
    var img = imgAr[num];
    var out = (path + img);
    return (out);
}

export function UIFxPY(value, customVLM) {
    // UIFX Player v1.4A
    var dispatcher = value;
    var userVLM = localStorage.getItem('UIfx');
    var VLM;
    var conv = parseFloat(userVLM);
    if (conv < 1.1) {
        if (conv == 1) {
            VLM = 1.0;
        }
        if (conv == 0) {
            VLM = 0.0;
        }
        else {
            VLM = conv;
        }
    }
    else {
        VLM = 1.0;
    }
    var beep = new uifx({ asset: dispatcher });
    DevOptions.ShowFunctionsLogs? console.log('The Volume of UIFX is on ', VLM || customVLM, '/ User set on', conv) : null
    beep.setVolume(VLM || customVLM).play();
}


export function WeatherAPI() {
    let city = 'pamplona';
    let country = 'spain';
    var Api_Key = yConfig.openwheater_apiKey;
    var _this = this;
    var urlOBJ = ("http://api.openweathermap.org/data/2.5/weather?q=" + city + "," + country + "&appid=2acf34be0b8f033b89ba4de1e674d42a");
    var returnData;
    var AjaxRequest = {
        "url": urlOBJ,
        "method": "POST",
        "timeout": 0,
        "processData": true,
        "contentType": false
    };
    jquery.ajax(AjaxRequest)
        .done(function (response) {
        returnData = response;
    });
    return (returnData);
}

export function RefreshONCE(){
 window.location.reload(); 
}

