import jquery from 'jquery'
import * as app from 'app'

export function API_Call(callback, endpoint, payload, options, __token) {
  var prefix = `[API_Call] `
  if (!endpoint) return false
  if (!payload) {
    app.yconsole.log(prefix, 'Calling api without Payload!!!')
  }
  let payloadContainer = payload ? payload : new FormData()
  payloadContainer.append('server_key', app.__server.getKey())


  const defaultOptions = {
    method: 'POST',
    timeout: 0,
    processData: false,
    includeUserID: false,
    override__token: false,
    disabledToken: false,
  }

  let fendpoint
  let method = defaultOptions.method
  let timeout = defaultOptions.timeout
  let processData = defaultOptions.processData
  let includeUserID = defaultOptions.includeUserID
  let override__token = defaultOptions.override__token
  let disabledToken = defaultOptions.disabledToken

  if (options) {
    options.method ? (method = options.method) : null
    options.timeout ? (timeout = options.timeout) : null
    options.processData ? (processData = true) : null
    options.includeUserID ? (includeUserID = options.includeUserID) : null
    options.override__token ? (override__token = options.override__token) : null
    options.disabledToken ? (disabledToken = options.disabledToken) : null
  }

  if (disabledToken) {
    app.yconsole.log(`${prefix} Dimmissing the token generation`)
    fendpoint = `${endpoint}`
  }

  if (!disabledToken && !override__token) {
    fendpoint = `${endpoint}?access_token=${app.token_data.__token()}`
  }

  if (override__token || __token) {
    if (!__token) {
      app.yconsole.log(`${prefix} Missing Overriding __token`)
      return
    }
    app.yconsole.log(`${prefix} Overriding __token => ${__token}`)
    fendpoint = `${endpoint}?access_token=${__token}`
  }

  if (includeUserID) {
    payloadContainer.append('user_id', app.token_data.__id())
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
          app.api_err.tokenError(response)
        }
      } catch (error) {
        app.yconsole.log(
          '[VIOLATION] The status of the request has not been identified!'
        )
        app.api_err.violation()
      }
      app.yconsole.debug(response)
      return callback(false, response)
    })
    .fail(error => {
      app.yconsole.debug(`${prefix} (ERROR) `, error)
      app.api_err.fail(error)
      return callback(true, error)
    })
}
