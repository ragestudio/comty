import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import { Icons } from "components/Icons"
import { Skeleton, PostsFeed } from "components"
import { Session, User } from "models"

import "./index.less"

export default class Account extends React.Component {
	static bindApp = ["userController", "sessionController"]

	state = {
		isSelf: false,
		user: null,
		sessions: null
	}

	api = window.app.request

	componentDidMount = async () => {
		const token = await Session.decodedToken()
		const location = window.app.history.location
		const query = new URLSearchParams(location.search)

		const requestedUser = location.state?.username ?? query.get("username") ?? token?.username
		let state = this.state

		if (requestedUser != null) {
			if (token.username === requestedUser) {
				state.isSelf = true
				state.sessions = await this.props.contexts.app.sessionController.getAllSessions()
			}

			state.user = await this.props.contexts.app.userController.getData({ username: requestedUser })
		}

		state.hasAdmin = await User.hasRole("admin")

		this.setState(state)
	}

	render() {
		const user = this.state.user

		if (!user) {
			return <Skeleton />
		}

		return (
			<div className="account_wrapper">
				<div className="card">
					<div className="header">
						<img src={user.avatar} />
						<div style={{ margin: "0 15px" }}>
							{Boolean(user.fullName) ?
								<>
									<h1>{user.fullName}</h1>
									<span>@{user.username}#{user._id}</span>
								</> :
								<>
									<h1>@{user.username}</h1>
									<span>#{user._id}</span>
								</>
							}
						</div>
					</div>
					<div className="extension">
						<div className="badgesList">
							{user.badges.map((role, index) => {
								return <antd.Tag>{role}</antd.Tag>
							})}
						</div>
					</div>
				</div>

				<div className="posts">
				  <PostsFeed 
				  	fromUserId={user._id}
				  />
				</div>
			</div>
		)
	}
}