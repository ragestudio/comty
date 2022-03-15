import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import { Icons } from "components/Icons"
import { Skeleton, PostsFeed, FollowButton } from "components"
import { Session, User } from "models"

import "./index.less"

export default class Account extends React.Component {
	static bindApp = ["userController", "sessionController"]

	state = {
		isSelf: false,
		isFollowed: false,
		user: null,
		requestedUser: null,
	}

	api = window.app.request

	componentDidMount = async () => {
		const token = await Session.decodedToken()
		const location = window.app.history.location
		const query = new URLSearchParams(location.search)

		const requestedUser = location.state?.username ?? query.get("username") ?? token?.username
		const hasAdmin = await User.hasRole("admin")

		let isSelf = false
		let user = null
		let isFollowed = false

		if (requestedUser != null) {
			if (token.username === requestedUser) {
				isSelf = true
			}

			user = await this.fetchData(requestedUser)

			if (!isSelf) {
				const result = await this.api.get.isFollowed(undefined, { user_id: user._id }).catch(() => false)
				console.log(result)

				if (result) {
					isFollowed = result.isFollowed
				}
			}
		}

		await this.setState({
			isSelf,
			user,
			hasAdmin,
			requestedUser,
			isFollowed,
		})
	}

	fetchData = async (username) => {
		return await this.api.get.user(undefined, {
			username: username
		}).catch((error) => {
			console.error(error)
			antd.message.error(error.message)
			return false
		})
	}

	onClickFollow = async () => {
		const result = await this.api.put.followUser({
			username: this.state.requestedUser,
		})
			.catch((error) => {
				console.error(error)
				antd.message.error(error.message)
				return false
			})

		console.log(result)

		await this.setState({
			isFollowed: result.following,
		})
	}

	render() {
		const user = this.state.user

		if (!user) {
			return <Skeleton />
		}

		return (
			<div className="accountProfile">
				<div className="card">
					<div className="header">
						<div className="user">
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

						{!this.state.isSelf && <div>
							<FollowButton
								onClick={this.onClickFollow}
								followed={this.state.isFollowed}
							/>
						</div>}
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