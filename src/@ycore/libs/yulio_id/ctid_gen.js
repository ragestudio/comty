import * as ycore from 'ycore'
/**
 * Cookies Token ID Generator
 *
 * @callback {func} return with (err,res) model
 * @payload {object} Payload data
 */
export function __CTID_GEN(callback, payload) {
  const { token, sdcp } = payload

  const { UserID, UserToken } = token
  const a = ycore.cryptSDCP.atob_parse(sdcp)

  const { avatar, admin, pro, dev, is_pro, username } = a

  const frame = {
    UserID,
    UserToken,
    avatar,
    admin,
    pro,
    dev,
    is_pro,
    username,
    exp: ycore.AppSettings.SignForNotExpire
      ? 0
      : Math.floor(Date.now() / 1000) + 60 * 60,
  }
  ycore.token_data.set(frame, done => {
    done ? callback(false, true) : callback(true, false)
  })
}
