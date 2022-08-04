import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import moment from "moment"

import { Icons } from "components/Icons"
import { Image, Skeleton, PostsFeed, FollowButton, FollowersList } from "components"
import { Session, User } from "models"

import "./index.less"

const TabsComponent = {
	"posts": React.memo((props) => {
		return <div className="posts">
			<PostsFeed
				fromUserId={props.state.user._id}
			/>
		</div>
	}),
	"followers": React.memo((props) => {
		return <FollowersList
			followers={props.state.followers}
		/>
	}),
	"details": React.memo((props) => {
		return <div id="statistics" className="statistics">
			<div>
				<span><Icons.Users /> {props.state.followers.length} Followers</span>
			</div>
			<div>
				<span><Icons.FileText /> 0 Posts</span>
			</div>
			<div>
				<span>Joined at {moment(new Date(Number(props.state.user.createdAt))).format("YYYY")}</span>
			</div>
		</div>
	})
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
		return <h1>Nothing to see here...</h1>
	}

	return <div className={classnames("fade-opacity-active", { "fade-opacity-leave": transitionActive })}>
		<Tab {...props} />
	</div>
})

// TODO: profileCard scroll effect (Hide description and wrap with entire body when cover image is not visible)

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
			{user.cover && <div className="cover" style={{ backgroundImage: `url("${user.cover}")` }} />}
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

				<div className="switchTab">
					<antd.Segmented
						//block
						options={Object.keys(TabsComponent).map((key) => key.toTitleCase())}
						value={this.state.tabActiveKey.toTitleCase()}
						onChange={this.handlePageTransition}
					/>
				</div>
			</div>

			<div className="tabContent">
				<TabRender
					renderKey={this.state.tabActiveKey}
					state={this.state}
				/>
			</div>
		</div>
	}
}