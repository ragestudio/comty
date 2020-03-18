import * as ycore from 'ycore'
import * as antd from 'antd'
import Cookies from "ts-cookies";
import keys from '../../../../config/keys.js';
import * as Icons from '@ant-design/icons';

var jquery = require("jquery");
var jwt = require("jsonwebtoken")


export function userData(){
    return ycore.handlerYIDT.get()
}



function __API__User (payload, sdcp){
    const now = new Date()
    now.setDate(now.getDate() + 1)
    const { UserID, UserToken } = payload

    const a = ycore.CryptSDCP.atob_parse(sdcp)
    const { avatar, admin, pro, dev, is_pro, username } = a;

    const frame = { 
        UserID, 
        UserToken, 
        avatar,
        admin,
        pro,
        dev,
        is_pro,
        username,
        deadline: ( ycore.DevOptions.SignForNotExpire? null : now.getTime() )
    }
    ycore.handlerYIDT.set(frame, done => {
        ycore.RefreshONCE()
    })
}

export const handlerYIDT = {
    set: (value, callback) => {
        const ExpireTime =  ycore.DevOptions.MaxJWTexpire
        jwt.sign(
            value,
            keys.secretOrKey,
            ycore.DevOptions.SignForNotExpire?  { expiresIn: '0' } :  { expiresIn: ExpireTime },
            (err, token) => {
                err? null : Cookies.set('cid', token)
                callback(true)
            }
        )
        ycore.yconsole.debug(frame)
        return true
    },
    getRaw: () => {
        return Cookies.get('cid')
    },
    get: () => {
        let final = jwt.decode(Cookies.get('cid')) || jwt.decode(localStorage.getItem('last_backup'));
        const a = jwt.decode(Cookies.get('cid'))
        const b = jwt.decode(localStorage.getItem('last_backup'))
        if (!a && !b) {
            final = false
            return final
        }
        if (!a) {
            final = b
        }
        if (!b) {
            final = a
        }
        ycore.yconsole.debug(final)
        return final
    },
    remove: () =>{
        Cookies.remove('cid')
    },
    __token: () => {
        return ycore.handlerYIDT.get().UserToken
    },
    __id: () => {
        return ycore.handlerYIDT.get().UserID
    }

}

export function ValidLoginSession(callback){
    const prefix = '[YID Session]';
    let final = false;
    let ValidCookiesToken = false;
    let ValidSDCP = false;

    let TokenContainer = Cookies.get('cid');

    if (TokenContainer) {
      let TokenContainerDC = jwt.decode(TokenContainer)
      if (TokenContainerDC){
        ValidCookiesToken = true
      }
    }

    if (ycore.CryptSDCP.valid()){
        ValidSDCP = true;
    }

    if (ValidCookiesToken == true){
        final = true
    } 

    const finalvalids = { ValidSDCP, ValidCookiesToken, final }
    ycore.DevOptions.ShowFunctionsLogs? (
        console.group(`%c ${prefix} `, 'background: #339edf; color: #fff'),
        console.log(`Valid SDCP => ${ValidSDCP}`),
        console.log(`Valid Token => ${ValidCookiesToken}`),
        console.log(`Session is valid => ${final}`),
        console.groupEnd() 
    ) : null
    if (callback) {
        callback(finalvalids)
    }
    return final
}
export function ValidBackup(){
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
        ycore.asyncLocalStorage.setItem('last_backup', Cookies.get('cid'))
        return
    }
}
export function LogoutCall(){
    const prefix = ('[YID Session]  ')
    ycore.yconsole.log('Logout Called !')
    let DecodedToken = ycore.handlerYIDT.__token() || atob(localStorage.getItem('last_backup'))
    const urlOBJ = (`${ycore.endpoints.removeToken}${DecodedToken}`)
    ycore.yconsole.log(prefix, ' Login out with token => ', DecodedToken, urlOBJ)
    const form = new FormData();
    form.append("server_key", ycore.yConfig.server_key);
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
        ycore.yconsole.log(`Exit with => ${api_state}`)
        if (api_state == '404') {
            antd.notification.open({
                placement: 'topLeft',
                message: 'Unexpectedly failed logout in YulioID™ ',
                description: 'It seems that your token has been removed unexpectedly and could not log out from YulioID ',
                icon: <Icons.WarningOutlined style={{ color: 'orange' }} />
            })
            ycore.yconsole.log("Failed logout with YulioID™", response)
        }
        else {
            ycore.yconsole.log("Successful logout with YulioID™", response, urlOBJ)
        }
        // Runtime after dispatch API
        ycore.handlerYIDT.remove()
        ycore.router.push({pathname: '/login',})
    })
}
export function __AppSetup__(EncUsername, EncPassword, callback) {
    const prefix = '[Auth Server]:';
    if (!EncUsername || !EncPassword) {
        const message = 'Missing Data! Process Aborted...';
        ycore.yconsole.log(prefix, message);
    }
    const server_key = ycore.yConfig.server_key;
    let username = atob(EncUsername);
    let password = atob(EncPassword);
    const form = new FormData();
    form.append("server_key", server_key);
    form.append("username", username);
    form.append("password", password);
    const settings = {
        "url":  ycore.endpoints.auth_endpoint,
        "method": "POST",
        "timeout": 0,
        "processData": false,
        "mimeType": "multipart/form-data",
        "contentType": false,
        "data": form
    };
    jquery.ajax(settings)
        .done(function (response) {
            ycore.yconsole.log(prefix, 'Server response... Dispathing data to login API...');
            try {
                var identState = JSON.parse(response)['api_status'];
                if (identState == 200) {
                  const UserID = JSON.parse(response)['user_id'];
                  const UserToken = JSON.parse(response)['access_token'];
                  let FramePayload = { UserID, UserToken }
                  ycore.yconsole.log(FramePayload)
                  callback(null, '200')
                  
                  ycore.GetSDCPfromCloud(FramePayload, (res) => res? __API__User(FramePayload, res) : null )
                  ycore.SetupApp()
                }
                if (identState == 400) {
                  callback(null, '400')
                }
            } catch (error) {
                callback(true, '500')
                ycore.notifyError('Server bad response')
            }
            return;
    })
        .fail(function (response) {
        const exception = new Error("Server failed response . . . :( ");
        return;
    })
}

export function GetUserData (values, callback) {
    const prefix = '[YID SDCP]';
    const offlineAPI = ycore.handlerYIDT.get();
    const globalValue = values || {UserToken: offlineAPI.UserToken, UserID: offlineAPI.UserID};
    const usertoken = globalValue.UserToken
    const userid = globalValue.UserID
    if (!globalValue) {
        const message = 'Missing payload! Exception while request data... Maybe the user is not login';
        ycore.yconsole.log(prefix, message)
        return;
    }
    const ApiPayload = new FormData();
    ApiPayload.append("server_key", ycore.yConfig.server_key);
    ApiPayload.append("fetch", 'user_data');
    ApiPayload.append("user_id", userid);
    const urlOBJ =  (`${ycore.endpoints.get_userData_endpoint}${usertoken}`)
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
           callback(null, resParsed)
        }
       )
      .fail(
         function (response) {
            ycore.yconsole.log(prefix, 'Server failure!', response)
            callback(true, response )
        }
     )
}

export const IsThisUser = {
    admin: () => {
        const a = ycore.userData()
        return ycore.booleanFix(a.admin)? true : false
    },
    dev: () => {
        const a = ycore.userData()
        return ycore.booleanFix(a.dev)? true : false
    },
    pro: () => {
        const a = ycore.userData()
        return ycore.booleanFix(a.is_pro)? true : false
    },
    same: (a) => {
        if(a == ycore.userData().UserID){
            return true
          }
        return false
    }
}