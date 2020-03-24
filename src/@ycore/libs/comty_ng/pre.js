import * as ycore from 'ycore'
import * as Icons from '@ant-design/icons'
import { RenderFeed } from 'components/MainFeed'

export const FeedHandler = {
  refresh: () => {
    RenderFeed.RefreshFeed()
  },
  killByID: (post_id) => {
    RenderFeed.killByID(post_id)
  },
  addToRend: (payload) => {
    RenderFeed.addToRend(payload)
  }
}

export const IsThisPost = {
  owner: (post_uid) => {
    const a = ycore.handlerYIDT.__id()
    if (post_uid == a) {
      return true
    }
    return false
  },
  boosted: () => {

  },
  pinned: () => {

  },
  flagged: () => {

  }
}

export const Post_Comments = {
  delete: (callback, payload) => {
    if (!payload) {return false}
    const { comment_id } = payload

    let formdata = new FormData();
    formdata.append("type", "delete");
    formdata.append("comment_id", comment_id);
  
    ycore.API_Call((err,res)=> {
      return callback(err,res)
    },
    ycore.endpoints.comments_actions,
    formdata,
    )
  },
  new: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { post_id, raw_text } = payload
    
    let formdata = new FormData();
    formdata.append("action", "comment");
    formdata.append("post_id", post_id);
    formdata.append("text", raw_text)
  
    ycore.API_Call((err,res)=> {
      return callback(err,res)
    },
    ycore.endpoints.action_post,
    formdata,
    )
  }
}

export const comty_user = {
  setData: () => {

  },
  follow: (callback, payload) => {
    if (!payload) {return false}
    const { user_id } = payload

    let formdata = new FormData();
    formdata.append("user_id", user_id);
  
    ycore.API_Call((err,res)=> {
      return callback(err,res)
    },
    ycore.endpoints.follow_user,
    formdata,
    )
  },
  block:(callback, payload) => {
    // TO DO
    return false
  },
  find: (callback, payload) => {
    if (!payload) {return false}
    const { key } = payload

    let formdata = new FormData();
    formdata.append("search_key", key);
    
    const callOptions = { timeout: 10000 }
    ycore.API_Call((err,res)=> {
      return callback(err,res)
    },
    ycore.endpoints.find_user,
    formdata,
    callOptions
    )
  },
  __tags: (callback, payload) => {
    if (!payload) {return false}
    const { id } = payload

    let formdata = new FormData();
    formdata.append("user_id", id )
  
    ycore.API_Call((err,res)=> {
      return callback(err,res)
    },
    ycore.endpoints.get_user_tags,
    formdata
    )
  }
}

export const comty_post = {
  getFeed: (callback, payload) => {
    if (!payload) {return false}
    const { fkey, type, id } = payload
    
    let formdata = new FormData();
    formdata.append("after_post_id", (fkey || 0))
    formdata.append("limit", ycore.AppSettings.limit_post_catch || 20)
    switch (type) {
      case 'feed':
        formdata.append("type", "get_news_feed");
        break;
      case 'user':
        formdata.append("type", "get_user_posts");
        formdata.append("id", id)
        break;
      default:
        formdata.append("type", "get_news_feed");
        break;
    }
    ycore.API_Call((err,res)=> {
      return callback(err,res)
    },
    ycore.endpoints.get_posts,
    formdata,
    )

  },
  get: (callback, payload) => {
    if (!payload) {return false}
    const { post_id, fetch } = payload

    let formdata = new FormData();
    formdata.append("post_id", post_id)
    formdata.append("fetch", (fetch || "post_data,post_comments,post_wondered_users,post_liked_users"))
    
    ycore.API_Call((err,res)=> {
      return callback(err,res)
    },
    ycore.endpoints.get_post_data,
    formdata
    )
    
  },
  new: (callback, payload) => {
    if (!payload) {return false}
    const { privacy, text, file } = payload
    
    let formdata = new FormData();
    formdata.append("type", "new_post")
    formdata.append("postPrivacy", privacy)
    formdata.append("postText", text);
    file? formdata.append("postPhoto", file) : null

    const callOptions = { includeUserID: true }
    ycore.API_Call((err,res)=> {
      return callback(err,res)
    },
    ycore.endpoints.new_post,
    formdata,
    callOptions
    )
  },
  delete: (callback, payload) => {
    if (!payload) {return false}
    const { post_id } = payload

    let formdata = new FormData();
    formdata.append("action", "delete");
    formdata.append("post_id", post_id)

    ycore.API_Call((err,res)=> {
      return callback(err,res)
    },
    ycore.endpoints.action_post,
    formdata,
    )
  },
  save: (callback, payload) => {

  },
  edit: (callback, payload) =>{

  },
  __pin: (callback, payload) => {

  },
  __boost: (callback, payload) => {

  }
}

export const comty_search = {
  keywords: (callback, payload) =>{
    if (!payload) {return false}
    const { key } = payload

    let formdata = new FormData();
    formdata.append("search_key", key);

    const callOptions = { timeout: 10000 }
    ycore.API_Call((err,res)=> {
      return callback(err,res)
    },
    ycore.endpoints.search_endpoint,
    formdata,
    callOptions
    )
  }
}

export const comty_get = {
  session_data: () => {

  },
  general_data: () => {
    if (!payload) {return false}
    const { id } = payload

    let formdata = new FormData();
    formdata.append("user_id", id);

    ycore.API_Call((err,res)=> {
      return callback(err,res)
    },
    ycore.endpoints.get_general_data,
    formdata
    )
  }
}

export const get_app_session = {
    get_id: (callback) => {
      let formdata = new FormData();
      formdata.append("server_key", ycore.yConfig.server_key);
      formdata.append("type", "get");
      const requestOptions = {
        method: 'POST',
        body: formdata,
        redirect: 'follow'
      };
      const uriObj = `${ycore.endpoints.get_sessions}${ycore.handlerYIDT.__token()}`
      fetch(uriObj, requestOptions)
        .then(response => response.text())
        .then(result => {
          const pre = JSON.stringify(result)
          const pre2 = JSON.parse(pre)
          const pre3 = JSON.stringify(JSON.parse(pre2)["data"])
          const obj = JSON.parse(pre3)["session_id"]
          return callback(null, obj) 
        })
      .catch(error => ycore.yconsole.log('error', error));
    },
    raw: (callback) => {
        const formdata = new FormData();
        formdata.append("server_key", ycore.yConfig.server_key);
        formdata.append("type", "get");
        const requestOptions = {
          method: 'POST',
          body: formdata,
          redirect: 'follow'
        };
        const uriObj = `${ycore.endpoints.get_sessions}${ycore.handlerYIDT.__token()}`
        fetch(uriObj, requestOptions)
          .then(response => response.text())
          .then(result => {
            const pre = JSON.stringify(result)
            const parsed = JSON.parse(pre)
            const obj = JSON.parse(parsed)["data"]
            ycore.yconsole.log(result, obj)
            return callback(null, obj)
          })
        .catch(error => ycore.yconsole.log('error', error));
    }
}


export const GetPostPrivacy = {
  bool: (e) => {
    switch (e) {
      case 'any':
          return '0'
      case 'only_followers':
          return '1'
      case 'only_follow':
          return '2'
      case 'private':
          return '3'
      default:
          return '0'
    }
  },
  decorator: (e) => {
      switch (e) {
          case 'any':
              return  <span><Icons.GlobalOutlined /> Share with everyone</span>
          case 'only_follow':
              return <span><Icons.TeamOutlined /> Share with people I follow</span>
          case 'only_followers':
              return <span><Icons.UsergroupAddOutlined /> Share with people follow me</span> 
          case 'private':
              return <span><Icons.EyeInvisibleOutlined /> Dont share, only me</span>
          default:
              return <span>Unknown</span>
      }
  },

}