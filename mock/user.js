import { Mock, Constant, qs, randomAvatar } from './_utils'
import jwt from 'jsonwebtoken';
import keys from '../config/keys.js';

const { ApiPrefix } = Constant


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
  

}
