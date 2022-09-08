import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import Loadable from "react-loadable"

import { Icons } from "components/Icons"
import { Image, Skeleton, FollowButton } from "components"
import { Session, User } from "models"

import DetailsTab from "./tabs/details"
import PostsTab from "./tabs/posts"
import FollowersTab from "./tabs/followers"

import "./index.less"

const TabsComponent = {
	"posts": PostsTab,
	"followers": FollowersTab,
	"details": DetailsTab
}

const TabRender = React.memo((props) => {
	const [transitionActive, setTransitionActive] = React.useState(false)
	const [activeKey, setActiveKey] = React.useState(props.renderKey)

	React.useEffect(() => {
		setTransitionActive(true)

		setTimeout(() => {
			setActiveKey(props.renderKey)

			setTimeout(() => {
				setTransitionActive(false)
			}, 100)
		}, 100)
	}, [props.renderKey])

	const Tab = TabsComponent[activeKey]

	if (!Tab) {
		return null
	}

	return <div className={classnames("fade-opacity-active", { "fade-opacity-leave": transitionActive })}>
		<Tab {...props} />
	</div>
})

const UserBadges = React.memo((props) => {
	return React.createElement(Loadable({
		loader: async () => {
			let { badges } = props

			if (!badges || Array.isArray(badges) === false || badges.length === 0) {
				return null
			}

			// fetch badges datam from api
			const badgesData = await app.api.request("main", "get", "badges", {
				_id: badges
			}).catch(() => false)

			if (!badgesData) {
				return null
			}

			return () => badgesData.map((badge, index) => {
				return <antd.Tag color={badge.color ?? "default"} key={index} id={badge.name} className="badge">
					<span>{badge.label}</span>
				</antd.Tag>
			})
		},
		loading: antd.Skeleton,
	}))
})

export default class Account extends React.Component {
	state = {
		requestedUser: null,

		user: null,
		followers: [],

		isSelf: false,
		isFollowed: false,

		transitionActive: false,
		tabActiveKey: "posts",

		isNotExistent: false,
	}

	coverComponent = React.createRef()

	api = window.app.api.withEndpoints("main")

	componentDidMount = async () => {
		const token = await Session.decodedToken()
		const location = window.app.history.location
		const query = new URLSearchParams(location.search)

		const requestedUser = this.props.username ?? location.state?.username ?? query.get("username") ?? token?.username
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

			if (!user) {
				this.setState({
					isNotExistent: true,
				})

				return false
			}

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

		// 
		app.eventBus.emit("style.compactMode", true)
	}

	componentWillUnmount = () => {
		app.eventBus.emit("style.compactMode", false)
	}

	fetchData = async (username) => {
		return await this.api.get.user(undefined, {
			username: username
		}).catch((error) => {
			console.error(error)

			return false
		})
	}

	onClickFollow = async () => {
		const result = await this.api.put.followUser({
			username: this.state.requestedUser,
		}).catch((error) => {
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
		if (typeof key !== "string") {
			console.error("Cannot handle page transition. Invalid key, only valid passing string", key)
			return
		}

		key = key.toLowerCase()

		if (this.state.tabActiveKey === key) {
			return false
		}

		this.setState({
			tabActiveKey: key
		})
	}

	handleScroll = (e) => {
		// if component scrolled foward set cover height to 0
		if (e.target.scrollTop > 0) {
			this.coverComponent.current.style.height = "0px"
		} else {
			this.coverComponent.current.style.height = ""
		}
	}

	render() {
		const user = this.state.user

		if (this.state.isNotExistent) {
			return <antd.Result
				status="404"
				title="This user does not exist, yet..."
			>

			</antd.Result>
		}

		if (!user) {
			return <Skeleton />
		}

		return <div className="accountProfile">
			{user.cover && <div ref={this.coverComponent} className="cover" style={{ backgroundImage: `url("${user.cover}")` }} />}
			<div className="profileCardWrapper">
				<div className="profileCard">
					<div className="basicData">
						<div className="title">
							<div className="field">
								<div className="avatar">
									<Image
										alt="ProfileImage"
										src={user.avatar}
									/>
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

				<div className="badgesTab">
					<React.Suspense fallback={<antd.Skeleton />}>
						<UserBadges badges={user.badges} />
					</React.Suspense>
				</div>
			</div>

			<div className="contents" onScroll={this.handleScroll}>
				<div className="tabMenuWrapper">
					<antd.Menu
						className="tabMenu"
						mode="vertical"
						selectedKeys={[this.state.tabActiveKey]}
						onClick={(e) => this.handlePageTransition(e.key)}
					>
						<antd.Menu.Item key="posts">
							Posts
						</antd.Menu.Item>

						<antd.Menu.Item key="followers">
							Followers
						</antd.Menu.Item>

						<antd.Menu.Item key="details">
							Details
						</antd.Menu.Item>
					</antd.Menu>
				</div>

				<div className="tabContent">
					<TabRender
						renderKey={this.state.tabActiveKey}
						state={this.state}
					/>
				</div>
			</div>
		</div>
	}
}