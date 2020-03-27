import * as ycore from 'ycore'
export * from './api_call.js'
import keys from '../../../../config/keys.js'

export const Alive_API = {
  fail: a => {
    if (a) {
      ycore.yconsole.log(a)
      ycore.notify.error(a)
    }
  },
  tokenError: a => {
    ycore.notify.expire(
      'It seems that your token has expired or no longer exists'
    )
    ycore.router.go('login')
  },
  violation: a => {
    ycore.notify.expire(
      'It seems that there has been a problem with your token, we need you to log in again.'
    )
    ycore.router.go('login')
  },
}
export const __server = {
  getKey: () => {
    return keys.server_key
  },
}
export const __rscloud = {
  yulio_id: {
    auth: (callback, payload) => {
      if (!payload) return false
      const { username, password } = payload

      const formdata = new FormData()
      formdata.append('username', username)
      formdata.append('password', password)

      const callOptions = { disabledToken: true }
      ycore.API_Call(
        (err, res) => {
          return callback(err, res)
        },
        ycore.endpoints.comty_endpoints.auth_endpoint,
        formdata,
        callOptions
      )
    },
    logout: callback => {
      const callOptions = { includeUserID: true }
      ycore.API_Call(
        (err, res) => {
          return callback(err, res)
        },
        ycore.endpoints.comty_endpoints.removeToken,
        null,
        callOptions
      )
    },
    verify: (callback, payload) => {},
    sign: (callback, payload) => {},
  },
  sdcp_cloud: {
    get: (callback, payload) => {
      if (!payload) return false
      const { user_token, user_id } = payload
      const formdata = new FormData()
      formdata.append('fetch', 'user_data')
      formdata.append('user_id', user_id)

      const optionCall = { override__token: true }
      ycore.API_Call(
        (err, res) => {
          try {
            let cooked = JSON.parse(res)['user_data']
            let Ensamblator = btoa(JSON.stringify(cooked))
            return callback(err, Ensamblator)
          } catch (error) {
            return callback(true, error)
          }
        },
        ycore.endpoints.comty_endpoints.get_userData_endpoint,
        formdata,
        optionCall,
        user_token
      )
    },
    set: () => {},
  },
}
