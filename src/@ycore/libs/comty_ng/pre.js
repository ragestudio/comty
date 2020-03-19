import * as ycore from 'ycore'
var jquery = require("jquery");
import * as Icons from '@ant-design/icons'


export function GetGeneralData(callback){
  let formdata = new FormData();
  formdata.append("user_id", id);
  formdata.append("server_key", ycore.yConfig.server_key);
  const requestOptions = {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
  };  
  const urlObj = `${ycore.endpoints.get_general_data}${ycore.handlerYIDT.__token()}`
  fetch(urlObj, requestOptions)
    .then(response => {
        ycore.yconsole.log(response)
        return callback(false, response)
      })
    .catch(error => {
      console.log('error', error)
      return callback(true, error)
    });
}

export function follow_user(id, callback) {
  let formdata = new FormData();
  formdata.append("user_id", id);
  formdata.append("server_key", ycore.yConfig.server_key);
  const requestOptions = {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
  };  
  ycore.yconsole.log(`Following user => ${id} `) 
  const urlObj = `${ycore.endpoints.follow_user}${ycore.handlerYIDT.__token()}`
  fetch(urlObj, requestOptions)
    .then(response => {
        ycore.yconsole.log(response)
        return callback(false, response)
      })
    .catch(error => {
      console.log('error', error)
      return callback(true, error)
    });
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

export function PublishPost(privacy, raw, file, callback){
  const  rawtext  = raw;
  if(!rawtext){
      return null
  }

  let formdata = new FormData();
  formdata.append("user_id", ycore.handlerYIDT.__id());
  formdata.append("type", "new_post")
  formdata.append("server_key", ycore.yConfig.server_key);
  formdata.append("postPrivacy", privacy)
  formdata.append("postText", raw);
  file? formdata.append("postPhoto", file) : null

  const requestOptions = {
    "url": `${ycore.endpoints.new_post}${ycore.handlerYIDT.__token()}`,
    "method": "POST",
    "timeout": 0,
    "data": formdata,
    "mimeType": "multipart/form-data",
    "processData": false,
    "contentType": false
  };  
  
  ycore.yconsole.log(`Sending new post => ${rawtext} `)
  jquery.ajax(requestOptions)
    .done(response => {
        ycore.yconsole.log(response)
        return callback(false, response)
      })
    .fail(error => {
        ycore.yconsole.log('error', error)
        return callback(true, error)
    });
}

export function FindUser(key, callback){
    let formdata = new FormData();
    formdata.append("server_key", ycore.yConfig.server_key);
    formdata.append("search_key", key);
    const urlOBJ = `${ycore.endpoints.find_user}${ycore.handlerYIDT.__token()}`
    const settings = {
        "url":  urlOBJ,
        "method": "POST",
        "timeout": 10000,
        "processData": false,
        "mimeType": "multipart/form-data",
        "contentType": false,
        "data": formdata
    };
    jquery.ajax(settings)
    .done(function (response) {
        return callback(null, response);
    })
    .fail(function (response) {
        const exception = 'API Bad response';
        return callback(exception, response);
    })
}

export function SeachKeywords(key, callback){
    let formdata = new FormData();
    formdata.append("server_key", ycore.yConfig.server_key);
    formdata.append("search_key", key);
    const urlOBJ = `${ycore.endpoints.search_endpoint}${ycore.handlerYIDT.__token()}`
    const settings = {
        "url":  urlOBJ,
        "method": "POST",
        "timeout": 10000,
        "processData": false,
        "mimeType": "multipart/form-data",
        "contentType": false,
        "data": formdata
    };
    jquery.ajax(settings)
    .done(function (response) {
        return callback(null, response);
    })
    .fail(function (response) {
        const exception = 'Request Failed';
        return callback(exception, response);
    })
}
export function ActionPost(type, id, value, callback){
  var formdata = new FormData();
  formdata.append("server_key", ycore.yConfig.server_key);
  if (!type || !id) {
    ycore.notifyError('[ActionPost] No type or id Provided !!!')
    return false
  }
  switch (type) {
    case 'like':
    {
      formdata.append("action", "like");
      formdata.append("post_id", id);
      break
    }
    case 'commet':
      {
        if (!value) {
          return false
        }
        formdata.append("action", "commet");
        formdata.append("text", value)
        break
      }
    case 'edit': 
    {
      if (!value) {
        return false
      }
      formdata.append("action", "edit");
      formdata.append("text", value)
      break
    }
    case 'delete': 
    {
      formdata.append("action", "delete");
      formdata.append("post_id", id);
      break
    }
    default:
      break;
  }
 
  const urlOBJ = `${ycore.endpoints.action_post}${ycore.handlerYIDT.__token()}`
  const settings = {
      "url":  urlOBJ,
      "method": "POST",
      "timeout": 3000,
      "processData": false,
      "mimeType": "multipart/form-data",
      "contentType": false,
      "data": formdata
  };
  jquery.ajax(settings)
  .done(function (response) {
      return callback(null, response);
  })
  .fail(function (response) {
      return callback(true, `[Server error] We couldnt ${type} this post`);
  })
}
export function GetUserTags(id, callback){
  if (!id) {
    return false
  }
  let formdata = new FormData();
  formdata.append("server_key", ycore.yConfig.server_key);
  formdata.append("user_id", id )

  const urlOBJ = `${ycore.endpoints.get_user_tags}${ycore.handlerYIDT.__token()}`
  const settings = {
      "url":  urlOBJ,
      "method": "POST",
      "timeout": 0,
      "processData": false,
      "mimeType": "multipart/form-data",
      "contentType": false,
      "data": formdata
  };
  jquery.ajax(settings)
  .done(function (response) {
      return callback(null, response);
  })
  .fail(function (response) {
      const exception = 'Request Failed';
      return callback(exception, response);
  })
}
export function GetPosts(userid, type, fkey, callback) {
  let formdata = new FormData();
  formdata.append("server_key", ycore.yConfig.server_key);
  formdata.append("after_post_id", (fkey || 0))
  formdata.append("limit", ycore.DevOptions.limit_post_catch || 20)
  switch (type) {
    case 'feed':
      formdata.append("type", "get_news_feed");
      break;
    case 'user':
      formdata.append("type", "get_user_posts");
      formdata.append("id", userid)
      break;
    default:
      formdata.append("type", "get_news_feed");
      break;
  }
  const urlOBJ = `${ycore.endpoints.get_posts}${ycore.handlerYIDT.__token()}`
  const settings = {
      "url":  urlOBJ,
      "method": "POST",
      "timeout": 10000,
      "processData": false,
      "mimeType": "multipart/form-data",
      "contentType": false,
      "data": formdata
  };
  jquery.ajax(settings)
  .done(function (response) {
      return callback(null, response);
  })
  .fail(function (response) {
      const exception = 'Request Failed';
      return callback(exception, response);
  })
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
