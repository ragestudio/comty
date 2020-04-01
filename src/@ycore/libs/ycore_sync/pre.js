import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import io from 'socket.io-client'
import config from 'config'

var endpoint = config.sync_server;


export const sync = {
    listen: (callback) => {
        let conn_overrun_tick = 0;
        const socket = io(endpoint);

        socket.on('connect_error', (error) => {
            conn_overrun_tick ++
            ycore.yconsole.log('Overrun tick => ',conn_overrun_tick)
            if (conn_overrun_tick == 1) {
                antd.notification.open({
                    onClose: () => conn_overrun_tick = 0,
                    duration: 15,
                    message: 'Disconected from server!',
                    description: 'Attempting to reconnect...',
                    icon: <Icons.LoadingOutlined spin />,
                  });    
                }
        });

        socket.on('connect', () => {
            conn_overrun_tick = 0
            antd.message.success('Connected to the server')
        });
   
        socket.on('pull_event', function (data) {
            console.log('SOCKET => ',data)
            callback(data)
        });

    },
    FeedListen: (callback) => {
        const socket = io(endpoint);
        socket.on('pull_event', function (data) {
            callback(data)
        });
    },
    emmitPost: (last_id) => {
        const socket = io(endpoint);
        socket.emit('push_event', last_id);
    }
}