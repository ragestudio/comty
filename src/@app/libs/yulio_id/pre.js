import * as app from 'app'

// EXPORT PUBLIC WORKERS
export * from './token_data.js'
export * from './ctid_gen.js'
export * from './validate.js'

export function userData() {
  return app.token_data.get()
}

export const IsThisUser = {
  admin: () => {
    return app.booleanFix(app.userData().admin) ? true : false
  },
  dev: () => {
    return app.booleanFix(app.userData().dev) ? true : false
  },
  pro: () => {
    return app.booleanFix(app.userData().is_pro) ? true : false
  },
  nsfw: () => {
    return app.booleanFix(app.userData().nsfw) ? true : false
  },
  same: a => {
    if (a == app.userData().UserID) {
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
    app.API_Call(
      (err, res) => {
        return callback(err, res)
      },
      app.gen_endpoint('early_user'),
      formdata,
      callOptions
    )
  }
}

export const yulio_id = {
  auth: (callback, payload) => {
    if (!payload) return false
    const { username, password } = payload

    const formdata = new FormData()
    formdata.append('username', username)
    formdata.append('password', password)

    const callOptions = { disabledToken: true }
    app.API_Call(
      (err, res) => {
        return callback(err, res)
      },
      app.gen_endpoint('auth'),
      formdata,
      callOptions
    )
  },
  logout: callback => {
    app.API_Call(
      (err, res) => {
        return callback(err, res)
      },
      app.gen_endpoint('delete-access-token'),
      null
    )
  },
  verify: (callback, payload) => {
    // TO DO
  },
  sign: (callback, payload) => {
    // TO DO
  },
  getData: (callback, payload) => {
    if (!payload) return false
    const { user_token, user_id } = payload
    const formdata = new FormData()
    formdata.append('fetch', 'user_data')
    formdata.append('user_id', user_id)

    const optionCall = { override__token: true }
    app.API_Call(
      (err, res) => {
        try {
          let a = JSON.parse(res)['user_data']
          return callback(err, a)
        } catch (error) {
          return callback(true, error)
        }
      },
      app.gen_endpoint('get-user-data'),
      formdata,
      optionCall,
      user_token
    )
  },
  setData: () => {
    // TO DO
  },
}