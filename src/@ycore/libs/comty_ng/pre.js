import * as ycore from 'ycore'
var jquery = require("jquery");
import * as Icons from '@ant-design/icons'

export function follow_user(id, callback) {
  let formdata = new FormData();
  formdata.append("user_id", id);
  formdata.append("server_key", ycore.yConfig.server_key);
  const requestOptions = {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
  };  
  ycore.DevOptions.ShowFunctionsLogs? console.log(`Following user => ${id} `) : null
  const urlObj = `${ycore.endpoints.follow_user}${ycore.GetUserToken.decrypted().UserToken}`
  fetch(urlObj, requestOptions)
    .then(response => {
        ycore.DevOptions.ShowFunctionsLogs? console.log(response) : null
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
  formdata.append("user_id", ycore.GetUserToken.decrypted().UserID);
  formdata.append("server_key", ycore.yConfig.server_key);
  formdata.append("postPrivacy", privacy)
  formdata.append("postText", raw);
  file? formdata.append("postPhotos", file) : null
  const requestOptions = {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
  };  
  ycore.DevOptions.ShowFunctionsLogs? console.log(`Sending new post => ${rawtext} `) : null
  const urlObj = `${ycore.endpoints.new_post}${ycore.GetUserToken.decrypted().UserToken}`
  fetch(urlObj, requestOptions)
    .then(response => {
        ycore.DevOptions.ShowFunctionsLogs? console.log(response) : null
        return callback(false, response)
      })
    .catch(error => {
      console.log('error', error)
      return callback(true, error)
    });
}

export function FindUser(key, callback){
    let formdata = new FormData();
    formdata.append("server_key", ycore.yConfig.server_key);
    formdata.append("search_key", key);
    const urlOBJ = `${ycore.endpoints.find_user}${ycore.GetUserToken.decrypted().UserToken}`
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
    const urlOBJ = `${ycore.endpoints.search_endpoint}${ycore.GetUserToken.decrypted().UserToken}`
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
  formdata.append("action", type);
  formdata.append("post_id", id);
  if (value) {
    formdata.append("text", value)
  }
  const urlOBJ = `${ycore.endpoints.action_post}${ycore.GetUserToken.decrypted().UserToken}`
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
export function GetPosts(userid, type, callback) {
  let formdata = new FormData();
  formdata.append("server_key", ycore.yConfig.server_key);
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
  const urlOBJ = `${ycore.endpoints.get_posts}${ycore.GetUserToken.decrypted().UserToken}`
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
      const fromSto = sessionStorage.getItem('se_src')
      if (!fromSto){
        ycore.DevOptions.ShowFunctionsLogs? console.log("Missing session_id, setting up...") : null
        let formdata = new FormData();
        formdata.append("server_key", ycore.yConfig.server_key);
        formdata.append("type", "get");
        const requestOptions = {
          method: 'POST',
          body: formdata,
          redirect: 'follow'
        };
        const uriObj = `${ycore.endpoints.get_sessions}${ycore.GetUserToken.decrypted().UserToken}`
        notifyProccess()
        fetch(uriObj, requestOptions)
          .then(response => response.text())
          .then(result => {
            const pre = JSON.stringify(result)
            const pre2 = JSON.parse(pre)
            const pre3 = JSON.stringify(JSON.parse(pre2)["data"])
            const obj = JSON.parse(pre3)["session_id"]
            return asyncSessionStorage.setItem('se_src', btoa(obj)).then( callback(null, obj) )
          })
        .catch(error => console.log('error', error));
      }
        ycore.DevOptions.ShowFunctionsLogs? console.log("Returning from storage") : null
        return callback( null, atob(fromSto) )
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
        const uriObj = `${ycore.endpoints.get_sessions}${ycore.GetUserToken.decrypted().UserToken}`
        fetch(uriObj, requestOptions)
          .then(response => response.text())
          .then(result => {
            const pre = JSON.stringify(result)
            const parsed = JSON.parse(pre)
            const obj = JSON.parse(parsed)["data"]
            ycore.DevOptions.ShowFunctionsLogs? console.log(result, obj) : null
            return callback(null, obj)
          })
        .catch(error => console.log('error', error));
    }
}
export function PushUserData(inputIO1, inputIO2) {
  var getStoragedToken = Cookies.get('access_token');
  var yCore_GUDEP = ycore.endpoints.update_userData_endpoint;
  var urlOBJ = "" + yCore_GUDEP + getStoragedToken;
  ycore.DevOptions.ShowFunctionsLogs? console.log('Recived', global, 'sending to ', urlOBJ) : null
  var form = new FormData();
  form.append("server_key", ycore.yConfig.server_key);
  form.append(inputIO1, inputIO2);
  var settings = {
      "url": urlOBJ,
      "method": "POST",
      "timeout": 0,
      "processData": false,
      "mimeType": "multipart/form-data",
      "contentType": false,
      "data": form
  };
  jquery.ajax(settings).done(function (response) {
    ycore.DevOptions.ShowFunctionsLogs? console.log(response) : null
  });
}