import * as app from 'app'

export async function post(id,callback){
    if(!id) return false
    const payload = { post_id: id }
    app.comty_post.get((err, response) => {
      try {
        return callback(JSON.parse(response)['post_data'])
      } catch (error) {
        console.log(error)
      }
    }, payload)
}

export async function comments(id,callback){
    if(!id) return false
    const payload = { post_id: id }
    app.comty_post.get((err, response) => {
     try {
        return callback(JSON.parse(response)['post_comments'])
     }catch (error) {
        console.log(error)
     }
    }, payload)
}

export function search(key,callback){
    if (!key) return false

    const payload = { key: key }
    app.comty_search.keywords((err, response) => {
      return callback(response)
    }, payload)
}

