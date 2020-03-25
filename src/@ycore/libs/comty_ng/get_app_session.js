import { __server, yconsole, endpoints, token_data } from 'ycore'

export const get_app_session = {
  get_id: callback => {
    let formdata = new FormData()
    formdata.append('server_key', __server.getKey())
    formdata.append('type', 'get')
    const requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow',
    }
    const uriObj = `${endpoints.get_sessions}${token_data.__token()}`
    fetch(uriObj, requestOptions)
      .then(response => response.text())
      .then(result => {
        const pre = JSON.stringify(result)
        const pre2 = JSON.parse(pre)
        const pre3 = JSON.stringify(JSON.parse(pre2)['data'])
        const obj = JSON.parse(pre3)['session_id']
        return callback(null, obj)
      })
      .catch(error => yconsole.log('error', error))
  },
  raw: callback => {
    const formdata = new FormData()
    formdata.append('server_key', __server.getKey())
    formdata.append('type', 'get')
    const requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow',
    }
    const uriObj = `${endpoints.get_sessions}${token_data.__token()}`
    fetch(uriObj, requestOptions)
      .then(response => response.text())
      .then(result => {
        const pre = JSON.stringify(result)
        const parsed = JSON.parse(pre)
        const obj = JSON.parse(parsed)['data']
        yconsole.log(result, obj)
        return callback(null, obj)
      })
      .catch(error => yconsole.log('error', error))
  },
}
