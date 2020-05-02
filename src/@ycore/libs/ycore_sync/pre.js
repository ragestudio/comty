import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
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
                ycore.yconsole.log('Overrun tick => ',conn_overrun_tick)
                if (conn_overrun_tick == 1) {
                    antd.notification.open({
                        duration: 5,
                        message: 'Disconected from server!',
                        description: 'Attempting to reconnect...',
                        icon: <Icons.LoadingOutlined spin />,
                      });    
                }
                if (conn_overrun_tick == ycore.AppSettings.Maximun_tick_overrun) {
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