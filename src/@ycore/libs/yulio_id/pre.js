import * as ycore from 'ycore'
import * as antd from 'antd'
import Cookies from "ts-cookies";
import keys from '../../../../config/keys.js';
import * as Icons from '@ant-design/icons';
import Icon from '@ant-design/icons'

var jquery = require("jquery");
var jwt = require("jsonwebtoken")

function __ServerAlive(a, callback){
    
}

function __API__User (payload){
    var ExpireTime =  ycore.DevOptions.MaxJWTexpire
    const now = new Date()
    now.setDate(now.getDate() + 1)
    const { UserID, UserToken } = payload
    const frame = { UserID, UserToken, deadline: ( ycore.DevOptions.SignForNotExpire? null : now.getTime() )}
    console.debug(frame)
    jwt.sign(
      frame,
      keys.secretOrKey,
      ycore.DevOptions.SignForNotExpire?  { expiresIn: '0' } :  { expiresIn: ExpireTime },
      (err, token) => {
       Cookies.set('token', token)
       ycore.RefreshONCE()
      }
    )
}
export function ValidLoginSession(){
    const prefix = '[YID Session]';
    let final = false;
    let ValidCookiesToken = false;
    let ValidSDCP = false;
    let TokenContainer = Cookies.get('token');
    let SDCPContainer = ycore.asyncSDCP.getSDCP();
    if (TokenContainer) {
      let TokenContainerDC = jwt.decode(TokenContainer)
      if (TokenContainerDC){
        ValidCookiesToken = true
      }
    }
    if (SDCPContainer) {
        try {
            atob(SDCPContainer)
            ValidSDCP = true 
        } catch (error) {
            return
        }
    }
    if (ValidCookiesToken == true  && ValidSDCP == true) {final = true} 
    ycore.DevOptions.ShowFunctionsLogs? (
        console.group(`%c ${prefix} `, 'background: #339edf; color: #fff'),
        console.log(`Valid SDCP => ${ValidSDCP}`),
        console.log(`Valid Token => ${ValidCookiesToken}`),
        console.log(`Session is valid => ${final}`),
        console.groupEnd() 
    ) : null
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
        ycore.asyncLocalStorage.setItem('last_backup', Cookies.get('token'))
        return
    }
}
export function LogoutCall(){
    const prefix = ('[YID Session]  ')
    console.log('Logout Called !')
    let DecodedToken = ycore.GetUserToken.decrypted().UserToken || atob(localStorage.getItem('last_backup'))
    const urlOBJ = (`${ycore.endpoints.removeToken}${DecodedToken}`)
    ycore.DevOptions.ShowFunctionsLogs? console.log(prefix, ' Login out with token => ', DecodedToken, urlOBJ) : null
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
        console.log(`Exit with => ${api_state}`)
        if (api_state == '404') {
            antd.notification.open({
                placement: 'topLeft',
                message: 'Unexpectedly failed logout in YulioID™ ',
                description: 'It seems that your token has been removed unexpectedly and could not log out from YulioID ',
                icon: <Icons.WarningOutlined style={{ color: 'orange' }} />
            })
            console.log("Failed logout with YulioID™", response)
        }
        else {
            console.log("Successful logout with YulioID™", response, urlOBJ)
        }
        // Runtime after dispatch API
        Cookies.remove('token')
        Cookies.remove('SDCP')
        ycore.router.push({pathname: '/login',})
    })
}
export function GetAuth(EncUsername, EncPassword, callback) {
    const prefix = '[Auth Server]:';
    if (!EncUsername || !EncPassword) {
        const message = 'Missing Data! Process Aborted...';
        console.log(prefix, message);
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
            console.log(prefix, 'Server response... Dispathing data to login API...');
            try {
                var identState = JSON.parse(response)['api_status'];
                if (identState == 200) {
                  const UserID = JSON.parse(response)['user_id'];
                  const UserToken = JSON.parse(response)['access_token'];
                  let FramePayload = { UserID, UserToken }
                  ycore.DevOptions.ShowFunctionsLogs ? console.log(FramePayload) : null
                  callback(null, '200')
                  ycore.InitSDCP(FramePayload, (done) => done? __API__User(FramePayload) : null )
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
        ycore.DevOptions.ShowFunctionsLogs ? console.debug(final) : null
        return final
    },
    raw: function () {
        return Cookies.get('token') || localStorage.getItem('last_backup');
    },
}
export function GetUserData (values, callback) {
    const prefix = '[YID SDCP]';
    const offlineAPI = ycore.GetUserToken.decrypted();
    const globalValue = values || {UserToken: offlineAPI.UserToken, UserID: offlineAPI.UserID};
    const usertoken = globalValue.UserToken
    const userid = globalValue.UserID
    if (!globalValue) {
        const message = 'Missing payload! Exception while request data... Maybe the user is not login';
        ycore.DevOptions.ShowFunctionsLogs? console.log(prefix, message) : null
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
            ycore.DevOptions.ShowFunctionsLogs ? console.log(prefix, 'Server failure!', response) : null
            callback(true, response )
        }
     )
}