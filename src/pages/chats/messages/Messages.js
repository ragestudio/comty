import React, { Component } from 'react';
import styles from '../styles.less'
import classnames from 'classnames'

export default class Messages extends Component {
	constructor(props) {
	  super(props);
		
		this.scrollDown = this.scrollDown.bind(this)
	}

	scrollDown(){
		const { container } = this.refs
		container.scrollTop = container.scrollHeight
	}

	componentDidMount() {
		this.scrollDown()
	}

	componentDidUpdate(prevProps, prevState) {
		this.scrollDown()
	}
	
	render() {
		const { messages, user, typingUsers } = this.props
		return (
			<div ref='container' style={{ width: '100%' }}>
					{
						messages.map((mes)=>{
							return (
								<div className={classnames(styles.chat_msg, {[styles.owner]: mes.sender == user.name? true : false })} key={mes.id}>
								<div className={styles.chat_msg_profile}>
								 <img className={styles.chat_msg_img} src={mes.avatar} />
								 <div className={styles.chat_msg_date}>{mes.time}</div>
								</div>
								<div className={styles.chat_msg_content}>
								 <div className={styles.chat_msg_text}>{mes.message}</div>
								</div>
							   </div>

								)
						})
					}
					{
						typingUsers.map((name)=>{
							return (
								<div key={name} className="typing-user">
									{`${name} is typing . . .`}
								</div>
							)
						})
					}


			</div>
		);
	}
}
