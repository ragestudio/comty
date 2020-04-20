import { API_Call, endpoints } from 'ycore'
import { comty_rsa } from '../rs_cloud/pre'

export const comty_user = {
  setData: () => {},
  getFollowers: (callback, payload) => {
    if (!payload)return false
    const { user_id } = payload

    let formdata = new FormData()
    formdata.append('user_id', user_id)
    formdata.append('fetch', 'followers')

    API_Call(
      (err,res) => {
        return callback(err,res)
      },
      comty_rsa.endpoint('get-user-data'),
      formdata
    )
  },
  follow: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { user_id } = payload

    let formdata = new FormData()
    formdata.append('user_id', user_id)

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.follow_user,
      formdata
    )
  },
  block: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { user_id, block_action } = payload
    let formdata = new FormData()
    formdata.append('user_id', user_id)
    formdata.append('block_action', block_action)

    API_Call((err,res)=>{
      return callback(err,res)
    },
    comty_rsa.endpoint('block-user'),
    formdata
    )
  },
  find: (callback, payload) => {
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
      endpoints.comty_endpoints.find_user,
      formdata,
      callOptions
    )
  },
  __tags: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { id } = payload

    let formdata = new FormData()
    formdata.append('user_id', id)

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.get_user_tags,
      formdata
    )
  },
}
