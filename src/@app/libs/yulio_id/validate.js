import * as app from 'app'
import Cookies from 'ts-cookies'
var jwt = require('jsonwebtoken')

export const cid_backup = {
  set: () => {
    localStorage.setItem('last_backup', Cookies.get('cid'))
  },
  get: () => {
    localStorage.getItem('last_backup')
  }
}

export const validate = {
  session: callback => {
    let validtoken = false
    const a = Cookies.get('cid')
    if (a) {
      const modExp = app.AppSettings.SignForNotExpire
      const ad = jwt.decode(a)

      let notexp = true // Sets if this is expired  (Default is not expired)
      let exists = false // Sets if this exist

      ad ? (exists = true) : null

      const tokenExp = ad.exp * 1000
      const tokenExpLocale = new Date(tokenExp).toLocaleString()
      const now = new Date().getTime()

      app.yconsole.log(
        `TOKEN EXP => ${tokenExp} ${
          modExp ? '( Infinite )' : `( ${tokenExpLocale} )`
        } || NOW => ${now}`
      )

      if (modExp == false) {
        if (tokenExp < now) {
          app.yconsole.log('This token is expired !!!')
          notexp = false
        }
      }
      if (notexp && exists) {
        validtoken = true
      }
    }

    if (callback) {
      callback(validtoken)
    }
    return validtoken
  },
  backup: () => {
    let ValidBackupToken = false
    let LastestToken = cid_backup.get()
    if (LastestToken) {
      let LastestTokenDC = jwt.decode(LastestToken)
      if (LastestTokenDC) {
        ValidBackupToken = true
      }
    }
    return ValidBackupToken
  }
}
