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
  session_data: () => {},
  general_data: () => {
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
