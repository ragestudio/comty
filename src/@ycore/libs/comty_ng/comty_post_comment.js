import { API_Call, endpoints } from 'ycore'

export const comty_post_comment = {
  delete: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { comment_id } = payload

    let formdata = new FormData()
    formdata.append('type', 'delete')
    formdata.append('comment_id', comment_id)

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.comments_actions,
      formdata
    )
  },
  new: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { post_id, raw_text } = payload

    let formdata = new FormData()
    formdata.append('action', 'comment')
    formdata.append('post_id', post_id)
    formdata.append('text', raw_text)

    API_Call(
      (err, res) => {
        return callback(err, res)
      },
      endpoints.action_post,
      formdata
    )
  },
}
