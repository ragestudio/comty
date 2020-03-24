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
    const a = ycore.userData()
    return ycore.booleanFix(a.admin) ? true : false
  },
  dev: () => {
    const a = ycore.userData()
    return ycore.booleanFix(a.dev) ? true : false
  },
  pro: () => {
    const a = ycore.userData()
    return ycore.booleanFix(a.is_pro) ? true : false
  },
  same: a => {
    if (a == ycore.userData().UserID) {
      return true
    }
    return false
  },
}
