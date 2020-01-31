import { Mock, Constant, qs, randomAvatar } from './_utils'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import keys from '../config/keys.js';

const { ApiPrefix } = Constant
const queryArray = (array, key, keyAlias = 'key') => {
  if (!(array instanceof Array)) {
    return null
  }
  let data

  for (let item of array) {
    if (item[keyAlias] === key) {
      data = item
      break
    }
  }

  if (data) {
    return data
  }
  return null
}
const NOTFOUND = {
  message: 'API Route Not Found',
  documentation_url: 'http://localhost:8000/request',
}

module.exports = {
  [`POST ${ApiPrefix}/user/login`](req, res) {
    var ExpireTime = '1556952'
    const now = new Date()
    now.setDate(now.getDate() + 1)
    const { UserID, UserToken } = req.body
    const frame = { UserID, UserToken, deadline: now.getTime()}
    jwt.sign(
      frame,
      keys.secretOrKey,
      { expiresIn: ExpireTime },
      (err, token) => {
        res.cookie('token', token, { maxAge: ExpireTime, httpOnly: false }),
        res.json({ success: true, token: token })
      }
    )
  },
  
  [`GET ${ApiPrefix}/user/logout`](req, res) {
    res.clearCookie('token')
    res.status(200).end()
  },
}
