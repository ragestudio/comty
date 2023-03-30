import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Translation } from "react-i18next"

import { Icons } from "components/Icons"
import { Skeleton, FollowButton, UserCard } from "components"
import { SessionModel, UserModel, FollowsModel } from "models"

import DetailsTab from "./tabs/details"
import PostsTab from "./tabs/posts"
import FollowersTab from "./tabs/followers"

import "./index.less"

const TabsComponent = {
	"posts": PostsTab,
	"followers": FollowersTab,
	"details": DetailsTab
}

const TabRender = React.memo((props, ref) => {
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

	// forwards ref to the tab
	return <div className={classnames("fade-opacity-active", { "fade-opacity-leave": transitionActive })}>
		{
			React.createElement(Tab, props)
		}
	</div>
})

export default class Account extends React.Component {
	state = {
		requestedUser: null,

		user: null,
		followers: [],

		isSelf: false,
		isFollowed: false,

		tabActiveKey: "posts",

		isNotExistent: false,
	}

	profileRef = React.createRef()

	contentRef = React.createRef()

	coverComponent = React.createRef()

	leftPanelRef = React.createRef()

	actionsRef = React.createRef()

	api = window.app.cores.api.withEndpoints()

	componentDidMount = async () => {
		const token = await SessionModel.getDecodedToken()
		const location = window.app.history.location
		const query = new URLSearchParams(location.search)

		const requestedUser = this.props.username ?? location.state?.username ?? query.get("username") ?? token?.username

		let isSelf = false
		let user = null
		let isFollowed = false
		let followers = []

		if (requestedUser != null) {
			if (token.username === requestedUser) {
				isSelf = true
			}

			user = await UserModel.data({
				username: requestedUser
			}).catch((error) => {
				console.error(error)

				return false
			})

			if (!user) {
				this.setState({
					isNotExistent: true,
				})

				return false
			}

			console.log(`Loaded User [${user.username}] >`, user)

			if (!isSelf) {
				const followedResult = await FollowsModel.imFollowing(user._id).catch(() => false)

				if (followedResult) {
					isFollowed = followedResult.isFollowed
				}
			}

			const followersResult = await FollowsModel.getFollowers(user._id).catch(() => false)

			if (followersResult) {
				followers = followersResult
			}
		}

		await this.setState({
			isSelf,
			user,
			requestedUser,
			isFollowed,
			followers,
		})
	}

	onPostListTopVisibility = (to) => {
		console.log("onPostListTopVisibility", to)

		if (to) {
			this.profileRef.current.classList.remove("topHidden")
		} else {
			this.profileRef.current.classList.add("topHidden")
		}
	}

	onClickFollow = async () => {
		const result = await FollowsModel.toogleFollow({
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

	toogleCoverExpanded = async (to) => {
		this.setState({
			coverExpanded: to ?? !this.state.coverExpanded,
		})
	}

	handlePageTransition = (key) => {
		if (typeof key !== "string") {
			console.error("Cannot handle page transition. Invalid key, only valid passing string", key)
			return
		}

		this.onPostListTopVisibility(true)

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

		return <div
			ref={this.profileRef}
			className="accountProfile"
			id="profile"
		>
			{
				user.cover && <div
					className={classnames("cover", {
						["expanded"]: this.state.coverExpanded
					})}
					ref={this.coverComponent}
					style={{ backgroundImage: `url("${user.cover}")` }}
					onClick={() => this.toogleCoverExpanded()}
					id="profile-cover"
				/>
			}

			<div className="panels">
				<div
					className="leftPanel"
					ref={this.leftPanelRef}
				>
					<UserCard
						user={user}
					/>

					<div
						className="actions"
						ref={this.actionsRef}
					>
						<FollowButton
							count={this.state.followers.length}
							onClick={this.onClickFollow}
							followed={this.state.isFollowed}
							self={this.state.isSelf}
						/>
					</div>
				</div>

				<div
					className="content"
					ref={this.contentRef}
				>
					<TabRender
						renderKey={this.state.tabActiveKey}
						state={this.state}
						onTopVisibility={this.onPostListTopVisibility}
					/>
				</div>

				<div className="tabMenuWrapper">
					<antd.Menu
						className="tabMenu"
						mode={window.isMobile ? "horizontal" : "vertical"}
						selectedKeys={[this.state.tabActiveKey]}
						onClick={(e) => this.handlePageTransition(e.key)}
					>
						<antd.Menu.Item
							key="posts"
							icon={<Icons.BookOpen />}
						>
							<Translation>
								{t => t("Posts")}
							</Translation>
						</antd.Menu.Item>

						<antd.Menu.Item
							key="followers"
							icon={<Icons.Users />}
						>
							<Translation>
								{t => t("Followers")}
							</Translation>
						</antd.Menu.Item>

						<antd.Menu.Item
							key="details"
							icon={<Icons.Info />}
						>
							<Translation>
								{t => t("Details")}
							</Translation>
						</antd.Menu.Item>
					</antd.Menu>
				</div>
			</div>
		</div>
	}
}