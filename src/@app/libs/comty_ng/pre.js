import { token_data } from 'app'
import * as Icons from '@ant-design/icons'

export * from './comty_post.js'
export * from './comty_user.js'
export * from './comty_post_comment.js'
export * from './comty_search.js'
export * from './comty_data.js'

export const IsThisPost = {
  owner: (post_uid) => {
    const a = token_data.__id()
    if (post_uid == a) {
      return true
    }
    return false
  },
  boosted: () => {

  },
  saved: () => {

  },
  pinned: () => {

  },
  flagged: () => {

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

import * as app from 'app'
import * as antd from 'antd'
import io from 'socket.io-client'
import config from 'config'

const prefix = '[Yulio Sync]'
var endpoint = config.sync_server;

export const sync = {
    listen: (callback) => {
        let active = true;
        if (active){
            let conn_overrun_tick = 0;
            const socket = io(endpoint);
            socket.on('connect_error', (error) => {
                conn_overrun_tick ++
                app.yconsole.log('Overrun tick => ',conn_overrun_tick)
                if (conn_overrun_tick == 1) {
                    antd.notification.open({
                        duration: 5,
                        message: 'Disconected from server!',
                        description: 'Attempting to reconnect...',
                        icon: <Icons.LoadingOutlined spin />,
                      });    
                }
                if (conn_overrun_tick == app.AppSettings.Maximun_tick_overrun) {
                    active = false;
                }
            });
            socket.on('connect', () => {
                conn_overrun_tick = 0
                // antd.message.success('Connected to the server')
            });
       
            socket.on('pull_event', function (data) {
                console.log('SOCKET => ',data)
                callback(data)
            });
        }else{
            console.log(prefix,' Offline Mode')
        }

    },
    FeedListen: (callback) => {
        const socket = io(`${endpoint}/feed`);
        
        socket.on('pull_event', function (data) {
            console.log(data)
            callback(data)
        });
    },
    emmitPost: (last_id) => {
        const socket = io(`${endpoint}/feed`);
        socket.emit('push_event', last_id);
    }
}