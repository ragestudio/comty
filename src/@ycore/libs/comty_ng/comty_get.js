import { API_Call, endpoints } from 'ycore'

export const comty_get = {
  sessions: (callback) => {
    let formdata = new FormData()
    formdata.append('type', 'get')

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.all_sessions,
      formdata
    )
  },
  session_id: callback => {
    let formdata = new FormData()
    formdata.append('type', 'get')

    API_Call((err,res) => {
      if (err) return false
      try {
        const a = JSON.parse(res)['data']
        return callback(err, a.session_id)
      } catch (error) {
        return callback(err, '0x0000')
      }
    },
    endpoints.get_sessions,
    formdata)
  },
  session: (callback) => {
    let formdata = new FormData()
    formdata.append('type', 'get')

    API_Call((err,res) => {
      return callback(err, res)
    },
    endpoints.get_sessions,
    formdata)
  },
  general_data: (callback, payload) => {
    if (!payload) return false
    const { id } = payload

    let formdata = new FormData()
    formdata.append('user_id', id)

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.get_general_data,
      formdata
    )
  },
}
