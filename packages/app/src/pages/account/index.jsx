import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"
import moment from "moment"

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
		followers: [],
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
		let followers = []

		if (requestedUser != null) {
			if (token.username === requestedUser) {
				isSelf = true
			}

			user = await this.fetchData(requestedUser)

			if (!isSelf) {
				const followedResult = await this.api.get.isFollowed(undefined, { user_id: user._id }).catch(() => false)
				const followersResult = await this.api.get.followers(undefined, { user_id: user._id }).catch(() => false)

				if (followedResult) {
					isFollowed = followedResult.isFollowed
				}

				if (followersResult) {
					followers = followersResult
				}
			}
		}

		await this.setState({
			isSelf,
			user,
			hasAdmin,
			requestedUser,
			isFollowed,
			followers,
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

		await this.setState({
			isFollowed: result.following,
			followers: result.followers,
		})
	}

	render() {
		const user = this.state.user

		if (!user) {
			return <Skeleton />
		}

		const createdAtYear = moment(new Date(Number(user.createdAt))).format("YYYY")

		return (
			<div className="accountProfile">
				<div className="card">
					<div className="header">
						<div className="user">
							<div>
								<img src={user.avatar} />
							</div>
							<div>
								<div>
									<h1>{user.fullName ?? user.username}</h1>
									<span>@{user.username}</span>
								</div>

								<div id="statistics" className="statistics">
									<div>
										<span><Icons.Users /> {this.state.followers.length} Followers</span>
									</div>
									<div>
										<span><Icons.FileText /> 0 Posts</span>
									</div>
									<div>
										<span>Joined at {createdAtYear}</span>
									</div>
								</div>
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