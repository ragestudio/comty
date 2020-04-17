import * as ycore from 'ycore'
import Cookies from 'ts-cookies'

// EXPORT PUBLIC WORKERS
export * from './token_data.js'
export * from './ctid_gen.js'
export * from './validate.js'

export function userData() {
  return ycore.token_data.get()
}

export const make_data = {
  backup: () => {
    localStorage.setItem('last_backup', Cookies.get('cid'))
  },
}

export const IsThisUser = {
  admin: () => {
    return ycore.booleanFix(ycore.userData().admin) ? true : false
  },
  dev: () => {
    return ycore.booleanFix(ycore.userData().dev) ? true : false
  },
  pro: () => {
    return ycore.booleanFix(ycore.userData().is_pro) ? true : false
  },
  nsfw: () => {
    return ycore.booleanFix(ycore.userData().nsfw) ? true : false
  },
  same: a => {
    if (a == ycore.userData().UserID) {
      return true
    }
    return false
  },
}

export const get_early = {
  user: (callback, payload)=>{
    if (!payload) {
      return false
    }
    const { username } = payload
    let formdata = new FormData()
    formdata.append('username', username)

    const callOptions = { timeout: 10000 }
    ycore.API_Call(
      (err, res) => {
        return callback(err, res)
      },
      ycore.comty_rsa.endpoint('early_user', {join_token: false}),
      formdata,
      callOptions
    )
  }
}