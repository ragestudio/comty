import * as app from 'app'

import Cookies from 'ts-cookies'
import {server_key} from '../../../../config/keys.js'
var jwt = require('jsonwebtoken')

export const token_data = {
  set: (value, callback) => {
    jwt.sign(value, server_key, (err, token) => {
      err ? null : Cookies.set('cid', token)
      return callback(true)
    })
  },
  getRaw: () => {
    return Cookies.get('cid')
  },
  get: () => {
    let final =
      jwt.decode(Cookies.get('cid')) ||
      jwt.decode(localStorage.getItem('last_backup'))
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
    return final
  },
  remove: () => {
    Cookies.remove('cid')
  },
  __token: () => {
    return app.token_data.get().UserToken
  },
  __id: () => {
    return app.token_data.get().UserID
  },
}
