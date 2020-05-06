import { API_Call, get_early, gen_endpoint } from 'app'

export const comty_user = {
  setData: () => {},
  data: {
    avatar: (callback,key) => {
      if(!key) return false

      try {
        const payload = {username: key}
        get_early.user((err,res) => {
          const d = JSON.parse(res)['data']        
          return callback(d.avatar)
        },payload)
      
      } catch (error) {
        return false
      }

    
    },

  },
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
      gen_endpoint('get-user-data'),
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
      gen_endpoint("follow-user"),
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
    gen_endpoint('block-user'),
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
      gen_endpoint("find_user"),
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
      gen_endpoint("user_tags"),
      formdata
    )
  },
}
