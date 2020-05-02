import React, { Component } from 'react';
import * as ycore from 'ycore'
import * as antd from 'antd'

const userData = ycore.userData()

export default class SideBar extends React.PureComponent{
	constructor(props){
		super(props)
		this.state = {
			reciever:""
		}
	}
	handleSubmit = (e) => {
		e.preventDefault()
		const { reciever } = this.state
		const { onSendPrivateMessage } = this.props

		onSendPrivateMessage(reciever)
		this.setState({reciever:""})
	}

	render(){
		const { chats, activeChat, user, setActiveChat } = this.props
		const { reciever } = this.state
	
		return (
			<div id="side-bar">

					<form onSubmit={this.handleSubmit} className="search">
						<input 
							placeholder="Search" 
							type="text"
							value={reciever}
							onChange={(e)=>{ this.setState({reciever:e.target.value}) }}/>
					</form>
					
					<div 
						className="users" 
						ref='users' 
						onClick={(e)=>{ (e.target === this.refs.user) && setActiveChat(null) }}>
						
						{
						chats.map((chat)=>{
							if(chat.name){
								const lastMessage = chat.messages[chat.messages.length - 1];
								const chatSideName = chat.users.find((name)=>{
									return name !== user.name
								}) || "Unknown" 
								const ops_adata = chat.udata.find((i) =>{
									return i.user !== user.name? i.avatar : null
								})
								const classNames = (activeChat && activeChat.id === chat.id) ? 'active' : ''
								return(
								<div 
									key={chat.id} 
									className={`user ${classNames}`}
									onClick={ ()=>{ setActiveChat(chat) } }
									>
									<div className="user-photo"> <antd.Avatar size="small" src={ops_adata.avatar} /> </div>
									<div className="user-info">
										<div className="name">{chatSideName}</div>
										{lastMessage && <div className="last-message">{lastMessage.message}</div>}
									</div>
									
								</div>
							)
							}

							return null
						})	
						}
						
					</div>
					
			</div>
		);
	
	}
}
