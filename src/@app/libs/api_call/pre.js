import * as app from 'app'
export * from './api_call.js'
import keys from '../../../../config/keys.js'

export const api_err = {
  fail: a => {
    if (a) {
      app.yconsole.log(a)
      app.notify.error(a)
    }
  },
  tokenError: a => {
    app.notify.expire(
      'It seems that your token has expired or no longer exists'
    )
    app.router.go('login')
  },
  violation: a => {
    app.notify.expire(
      'It seems that there has been a problem with your token, we need you to log in again.'
    )
    app.router.go('login')
  },
}

export const __server = {
  getKey: () => {
    return keys.server_key
  },
}

export function gen_endpoint(endpoint) {
  return `${app.AppSettings.__global_server_prexif}${endpoint}`   
}
