import { API_Call, endpoints, sdcp } from 'ycore'

export const comty_get = {
  sessions: (callback) => {
    let formdata = new FormData()
    formdata.append('type', 'get')

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.all_sessions,
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
    endpoints.comty_endpoints.get_sessions,
    formdata)
  },
  session: (callback) => {
    let formdata = new FormData()
    formdata.append('type', 'get')

    API_Call((err,res) => {
      return callback(err, res)
    },
    endpoints.comty_endpoints.get_sessions,
    formdata)
  },
  general_data: (callback, payload) => {
    let formdata = new FormData();
    let callOptions = { includeUserID: false };

    if (!payload) {
      callOptions = {  includeUserID: true }
      formdata.append('fetch', 'notifications,friend_requests,pro_users,promoted_pages,trending_hashtag,count_new_messages')
    }

    if (payload) { 
      payload.user_id? formdata.append('user_id', payload.user_id) : null
      payload.fetch? formdata.append('fetch', payload.fetch) : null
    }
  
    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.get_general_data,
      formdata, callOptions
    )
    
  },
  get_user_data: (callback, payload) => {
    let formdata = new FormData();
    let callOptions = { includeUserID: false };

    if (!payload) {
      callOptions = {  includeUserID: true }
      formdata.append('fetch', 'user_data')
    }

    if (payload) { 
      payload.user_id? formdata.append('user_id', payload.user_id) : null
      payload.fetch? formdata.append('fetch', payload.fetch) : null
    }
  
    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.get_userData,
      formdata, callOptions
    )
  }
}
