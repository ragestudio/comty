import { API_Call, endpoints, AppSettings, yconsole } from 'ycore'

export const comty_post = {
  getFeed: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { fkey, type, id } = payload

    let formdata = new FormData()
    formdata.append('after_post_id', fkey || 0)
    formdata.append('limit', AppSettings.limit_post_catch || 20)
    switch (type) {
      case 'feed':
        formdata.append('type', 'get_news_feed')
        break
      case 'user':
        formdata.append('type', 'get_user_posts')
        formdata.append('id', id)
        break
      default:
        formdata.append('type', 'get_news_feed')
        break
    }
    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.get_posts,
      formdata
    )
  },
  get: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { post_id, fetch } = payload

    let formdata = new FormData()
    formdata.append('post_id', post_id)
    formdata.append(
      'fetch',
      fetch || 'post_data,post_comments,post_wondered_users,post_liked_users'
    )

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.get_post_data,
      formdata
    )
  },
  new: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { privacy, text, file } = payload

    let formdata = new FormData()
    formdata.append('type', 'new_post')
    formdata.append('postPrivacy', privacy)
    formdata.append('postText', text)
    file ? formdata.append('postPhoto', file) : null

    const callOptions = { includeUserID: true }
    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.new_post,
      formdata,
      callOptions
    )
  },
  delete: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { post_id } = payload

    let formdata = new FormData()
    formdata.append('action', 'delete')
    formdata.append('post_id', post_id)

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.action_post,
      formdata
    )
  },
  save: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { post_id } = payload

    let formdata = new FormData()
    formdata.append('action', 'save')
    formdata.append('post_id', post_id)

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.action_post,
      formdata
    )
  },
  like: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { post_id } = payload

    let formdata = new FormData()
    formdata.append('action', 'like')
    formdata.append('post_id', post_id)

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.action_post,
      formdata
    )
  },
  getSaved: (callback, payload) => {
    if (!payload) {
      yconsole.log(
        'Calling api without Payload!!! | Limmit & OffsetKey = default |'
      )
    }
    if (payload) {
      const { limit, fkey } = payload
    }

    let formdata = new FormData()
    formdata.append('type', 'saved')
    formdata.append('limit', payload? limit : AppSettings.limit_post_catch || 20)
    formdata.append('after_post_id', payload? fkey : 0)

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.get_posts,
      formdata
    )
  },
  edit: (callback, payload) => {},
  __pin: (callback, payload) => {},
  __boost: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { post_id } = payload

    let formdata = new FormData()
    formdata.append('action', 'boost')
    formdata.append('post_id', post_id)

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.action_post,
      formdata
    )
  },
  __disableComments: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { post_id } = payload

    let formdata = new FormData()
    formdata.append('action', 'disable_comments')
    formdata.append('post_id', post_id)

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.action_post,
      formdata
    )
  },
  __report: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { post_id } = payload

    let formdata = new FormData()
    formdata.append('action', 'report')
    formdata.append('post_id', post_id)

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comty_endpoints.action_post,
      formdata
    )
  },
}
