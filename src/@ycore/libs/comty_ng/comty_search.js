import { API_Call, endpoints } from 'ycore'

export const comty_search = {
  keywords: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { key } = payload

    let formdata = new FormData()
    formdata.append('search_key', key)

    const callOptions = { timeout: 10000 }
    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.search_endpoint,
      formdata,
      callOptions
    )
  },
}
