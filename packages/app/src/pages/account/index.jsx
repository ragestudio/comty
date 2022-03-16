import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import moment from "moment"

import { Icons } from "components/Icons"
import { Skeleton, PostsFeed, FollowButton, FollowersList } from "components"
import { Session, User } from "models"

import "./index.less"

export default class Account extends React.Component {
	static bindApp = ["userController", "sessionController"]

	state = {
		transitionActive: false,
		activeKey: "posts",

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

				if (followedResult) {
					isFollowed = followedResult.isFollowed
				}
			}

			const followersResult = await this.api.get.followers(undefined, { user_id: user._id }).catch(() => false)

			if (followersResult) {
				followers = followersResult
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

	handlePageTransition = (key) => {
		if (this.state.activeKey === key) {
			return false
		}

		this.setState({
			transitionActive: true,
		})

		setTimeout(() => {
			this.setState({
				activeKey: key
			})

			setTimeout(() => {
				this.setState({
					transitionActive: false,
				})
			}, 100)
		}, 100)
	}

	render() {
		const user = this.state.user

		if (!user) {
			return <Skeleton />
		}

		return (
			<div className="accountProfile">
				{user.cover && <div className="cover" style={{ backgroundImage: `url("${user.cover}")` }} />}
				<div className="profileCard">
					<div className="basicData">
						<div className="title">
							<div className="field">
								<div className="avatar">
									<img src={user.avatar} />
								</div>
							</div>

							<div className="field">
								<div>
									<h1>{user.fullName ?? user.username}</h1>
									{user.verified && <Icons.verifiedBadge />}
								</div>

								<span>@{user.username}</span>
							</div>
						</div>

						{!this.state.isSelf && <div>
							<FollowButton
								count={this.state.followers.length}
								onClick={this.onClickFollow}
								followed={this.state.isFollowed}
							/>
						</div>}
					</div>

					<div className="description">
						<p>
							{user.description}
						</p>
					</div>
				</div>
				<antd.Tabs
					className="tabs"
					type="card"
					activeKey={this.state.activeKey}
					onTabClick={this.handlePageTransition}
					destroyInactiveTabPane
				>
					<antd.Tabs.TabPane tab={<><Icons.Inbox /> Posts</>} key="posts">
						<div className={classnames("fade-opacity-active", { "fade-opacity-leave": this.state.transitionActive })}>
							<div className="posts">
								<PostsFeed
									fromUserId={user._id}
								/>
							</div>
						</div>
					</antd.Tabs.TabPane>
					<antd.Tabs.TabPane tab={<><Icons.Users /> Followers</>} key="followers">
						<div className={classnames("fade-opacity-active", { "fade-opacity-leave": this.state.transitionActive })}>
							<FollowersList
								followers={this.state.followers}
							/>
						</div>
					</antd.Tabs.TabPane>
					<antd.Tabs.TabPane tab={<><Icons.Info /> Details</>} key="details">
						<div className={classnames("fade-opacity-active", { "fade-opacity-leave": this.state.transitionActive })}>
							<div id="statistics" className="statistics">
								<div>
									<span><Icons.Users /> {this.state.followers.length} Followers</span>
								</div>
								<div>
									<span><Icons.FileText /> 0 Posts</span>
								</div>
								<div>
									<span>Joined at {moment(new Date(Number(user.createdAt))).format("YYYY")}</span>
								</div>
							</div>
						</div>
					</antd.Tabs.TabPane>
				</antd.Tabs>
			</div>
		)
	}
}