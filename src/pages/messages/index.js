import React from 'react'
import * as app from 'app'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
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
      err_tick: 0,
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
        this.setState({user: payload, conn: true, err_tick: 0})
      })
    }

    this.setState({socket})

    socket.on('disconnect', () => {
			this.setState({ conn: false })
    })

    socket.on('reconnecting', () =>{
      this.setState({ err_tick: (this.state.err_tick+1) })
      console.log(prefix, 'Trying to reconnect', this.state.err_tick)
    })
	}

	render() {
    const { socket, user } = this.state
    if( this.state.err_tick > 2) return <antd.Result
    status="500"
    title="You're offline"
    subTitle="It seems that you are disconnected and could not connect to the server."
  />
    if(!user) return <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px', marginTop: '50px' }}><h1> <Icons.LoadingOutlined spin /> Connecting to server...</h1><antd.Skeleton active /></div>
		return <ChatContainer socket={socket} user={user} />
		
	}
  
}
