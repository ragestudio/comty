import * as ycore from 'ycore'
import io from 'socket.io-client'

var socket = io('http://localhost:5500');

export const sync = {
    emmitPost: () => {
        socket.emit('new');
    }
}