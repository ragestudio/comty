import jquery from 'jquery'
import * as ycore from 'ycore'

export function API_Call(callback, endpoint, payload, options, __token) {
  var prefix = `[API_Call] `
  if (!endpoint) return false
  if (!payload) {
    ycore.yconsole.log(prefix, 'Calling api without Payload!!!')
  }
  let payloadContainer = payload ? payload : new FormData()
  payloadContainer.append('server_key', ycore.__server.getKey())

  let fendpoint = `${endpoint}${ycore.token_data.__token()}`
  let method
  let timeout
  let processData
  let includeUserID
  let override__token
  let disabledToken

  if (options) {
    method = options.method ? options.method : 'POST'
    timeout = options.timeout ? options.timeout : 0
    processData = options.processData ? options.processData : false
    includeUserID = options.includeUserID ? options.includeUserID : false
    override__token = options.override__token ? options.override__token : false
    disabledToken = options.disabledToken ? options.disabledToken : false
  } else {
    method = 'POST'
    timeout = 0
    processData = false
    includeUserID = false
    override__token = false
    disabledToken = false
  }

  if (override__token || __token) {
    if (!__token) {
      ycore.yconsole.log(`${prefix} Missing Overriding __token`)
      return
    }
    ycore.yconsole.log(`${prefix} Overriding __token => ${__token}`)
    fendpoint = `${endpoint}${__token}`
  }

  if (disabledToken) {
    ycore.yconsole.log('${prefix} Dimmissing the token generation')
    fendpoint = `${endpoint}`
  }

  if (includeUserID) {
    payloadContainer.append('user_id', ycore.token_data.__id())
  }
  const requestOptions = {
    url: fendpoint,
    method: method,
    timeout: timeout,
    data: payloadContainer,
    mimeType: 'multipart/form-data',
    processData: processData,
    contentType: false,
  }

  jquery
    .ajax(requestOptions)
    .done(response => {
      try {
        const a = JSON.parse(response)['api_status']
        if (a == '404') {
          ycore.Alive_API.tokenError(response)
        }
      } catch (error) {
        ycore.yconsole.log('[VIOLATION] The status of the request has not been identified!')
        ycore.Alive_API.violation()
      }
      ycore.yconsole.log(response)
      return callback(false, response)
    })
    .fail(error => {
      ycore.yconsole.log(`${prefix} (ERROR) `, error)
      ycore.Alive_API.fail(error)
      return callback(true, error)
    })
}
