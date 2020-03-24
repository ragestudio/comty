import jquery from 'jquery'
import * as ycore from 'ycore'
import { FormatColorResetOutlined } from '@material-ui/icons'

export const Alive_API = {
    fail: (a) => {
        if (a){
            ycore.yconsole.log(a)
            ycore.notify.error(a)
        }
    }
}

export function API_Call(callback, endpoint, payload, options){
    if (!payload || !endpoint) {
      return false
    }
    let payloadContainer = payload;
    payloadContainer.append("server_key", ycore.yConfig.server_key);
    
    let method;
    let timeout;
    let processData;
    let includeUserID;

    if (options) {
        method = options.method? options.method : "POST"
        timeout = options.timeout? options.timeout : 0
        processData = options.processData? options.processData : false
        includeUserID = options.includeUserID? options.includeUserID : false
    }else {
        method = "POST"
        timeout = 0
        processData = false
        includeUserID = false
    }
    
    if (includeUserID) {
        payloadContainer.append("user_id", ycore.handlerYIDT.__id());
    }

    const requestOptions = {
      "url": `${endpoint}${ycore.handlerYIDT.__token()}`,
      "method": method,
      "timeout": timeout,
      "data": payloadContainer,
      "mimeType": "multipart/form-data",
      "processData": processData,
      "contentType": false
    };  
  
    jquery.ajax(requestOptions)
    .done(response => {
        ycore.yconsole.log(response)
        return callback(false, response)
      })
    .fail(error => {
        ycore.yconsole.log('error', error)
        ycore.Alive_API.fail(error)
        return callback(true, error)
    });
  }