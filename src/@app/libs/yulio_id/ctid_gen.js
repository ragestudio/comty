import * as app from 'app'
/**
 * Cookies Token ID Generator
 *
 * @callback {func} return with (err,res) model
 * @payload {object} Payload data
 */
export async function __CTID_GEN(callback, payload) {
  const { token, sdcp } = payload

  const { UserID, UserToken } = token
 
  const { avatar, admin, pro, dev, is_pro, username } = sdcp

  const frame = {
    UserID,
    UserToken,
    avatar,
    admin,
    pro,
    dev,
    is_pro,
    username,
    exp: app.AppSettings.SignForNotExpire
      ? 0
      : Math.floor(Date.now() / 1000) + 60 * 60,
  }
  console.log(frame)
  app.token_data.set(frame, done => {
    done ? callback(false, true) : callback(true, false)
  })
}


