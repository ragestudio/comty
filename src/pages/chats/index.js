import React from 'react'
import * as app from 'app'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import io from 'socket.io-client'
import config from 'config'
import ReactEmoji from 'react-emoji';
import { USER_CONNECTED, LOGOUT } from './Events'
import ChatContainer from './chats/ChatContainer'


const userData = app.userData()

const prefix = '[Messaging Socket] '
const socketUrl = io(`${config.sync_server}/messaging_socket`);

export default class Chats extends React.Component{
  constructor(props) {
	  super(props);
	
	  this.state = {
	  	socket:null,
      user:null,
      conn: false
	  };
	}

	componentDidMount() {
    this.initSocket()
	}

	/*
	*	Connect to and initializes the socket.
	*/
	initSocket = async ()=>{
		const socket = socketUrl

    if(!this.state.conn){
      await socket.on('connect', ()=>{
        console.log(prefix, "Connected");
        const payload = { id: userData.UserID, name: userData.username, avatar: userData.avatar }
        socket.emit(USER_CONNECTED, payload);
        this.setState({user: payload, conn: true})
      })
    }

    this.setState({socket})

    socket.on('disconnect', () => {
			this.setState({ conn: false })
    })

    socket.on('reconnecting', () =>{
      console.log(prefix, 'Trying to reconnect')
    })
	}

	render() {
    const { socket, user } = this.state
    if(!user) return <div ><h1>Loading</h1></div>
		return <ChatContainer socket={socket} user={user} />
		
	}
  
}
