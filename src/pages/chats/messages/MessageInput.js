import React, { Component } from 'react';
import styles from '../styles.less'

export default class MessageInput extends Component {
	
	constructor(props) {
	  super(props);
	
	  this.state = {
	  	message:"",
	  	isTyping:false
	  };

	}
	
	handleSubmit = (e)=>{
		e.preventDefault()
		this.sendMessage()
		this.setState({message:""})
	}

	sendMessage = ()=>{
		this.props.sendMessage(this.state.message)

	}

	componentWillUnmount() {
	  this.stopCheckingTyping()
	}

	sendTyping = ()=>{
		this.lastUpdateTime = Date.now()
		if(!this.state.isTyping){
			this.setState({isTyping:true})
			this.props.sendTyping(true)
			this.startCheckingTyping()
		}
	}

	/*
	*	startCheckingTyping
	*	Start an interval that checks if the user is typing.
	*/
	startCheckingTyping = ()=>{
		console.log("Typing");
		this.typingInterval = setInterval(()=>{
			if((Date.now() - this.lastUpdateTime) > 300){
				this.setState({isTyping:false})
				this.stopCheckingTyping()
			}
		}, 300)
	}
	
	/*
	*	stopCheckingTyping
	*	Start the interval from checking if the user is typing.
	*/
	stopCheckingTyping = ()=>{
		console.log("Stop Typing");
		if(this.typingInterval){
			clearInterval(this.typingInterval)
			this.props.sendTyping(false)
		}
	}


	render() {
		const { message } = this.state
		return (
				<form 
					onSubmit={ this.handleSubmit }
					className="message-form">
						  <div className={styles.chat_area_footer}>
						  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-video">
     <path d="M23 7l-7 5 7 5V7z" />
     <rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-image">
     <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
     <circle cx="8.5" cy="8.5" r="1.5" />
     <path d="M21 15l-5-5L5 21" /></svg>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus-circle">
     <circle cx="12" cy="12" r="10" />
     <path d="M12 8v8M8 12h8" /></svg>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-paperclip">
     <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
					<input 
						id = "message"
						ref = {"messageinput"}
						type = "text"
						value = { message }
						autoComplete = {'off'}
						placeholder = "Type something here..."
						onKeyUp = { e => { e.keyCode !== 13 && this.sendTyping() } }
						onChange = {
							({target})=>{
								this.setState({message:target.value})
							}
						}
						/>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-smile">
     <circle cx="12" cy="12" r="10" />
     <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></svg>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-thumbs-up">
     <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" /></svg>
						  </div>

				</form>

		);
	}
}
