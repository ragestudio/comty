import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { motion, AnimatePresence } from "motion/react"

import { Icons } from "@components/Icons"
import FollowButton from "@components/FollowButton"
import UserCard from "@components/UserCard"

import GenerateMenuItems from "@utils/generateMenuItems"

import SessionModel from "@models/session"
import UserModel from "@models/user"
import FollowsModel from "@models/follows"

import DetailsTab from "./tabs/details"
import PostsTab from "./tabs/posts"
import MusicTab from "./tabs/music"
import FollowersTab from "./tabs/followers"

import "./index.less"

const TabsComponent = {
	posts: PostsTab,
	followers: FollowersTab,
	details: DetailsTab,
	music: MusicTab,
}

export default class Account extends React.Component {
	state = {
		requestedUser: null,

		user: null,
		isSelf: false,

		followersCount: 0,
		following: false,

		tabActiveKey: "posts",

		isNotExistent: false,
	}

	contentRef = React.createRef()

	componentDidMount = async () => {
		app.layout.toggleCenteredContent(false)

		const token = await SessionModel.getDecodedToken()
		const requestedUser = this.props.username ?? token?.username

		let isSelf = false
		let user = null
		let followersCount = 0

		if (requestedUser != null) {
			if (token.username === requestedUser) {
				isSelf = true
			}

			user = await UserModel.data({
				username: requestedUser,
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

			const followersResult = await FollowsModel.getFollowers(
				user._id,
			).catch(() => false)

			if (followersResult) {
				followersCount = followersResult.count
			}
		}

		await this.setState({
			isSelf,
			requestedUser,
			user,

			following: user.following,
			followersCount: followersCount,
		})
	}

	onClickFollow = async () => {
		const result = await FollowsModel.toggleFollow({
			user_id: this.state.user._id,
		}).catch((error) => {
			console.error(error)
			antd.message.error(error.message)

			return false
		})

		await this.setState({
			following: result.following,
			followersCount: result.count,
		})
	}

	toggleCoverExpanded = async (to) => {
		this.setState({
			coverExpanded: to ?? !this.state.coverExpanded,
		})
	}

	handlePageTransition = (key) => {
		if (typeof key !== "string") {
			console.error(
				"Cannot handle page transition. Invalid key, only valid passing string",
				key,
			)
			return
		}

		key = key.toLowerCase()

		if (this.state.tabActiveKey === key) {
			return false
		}

		this.setState({
			tabActiveKey: key,
		})
	}

	render() {
		const user = this.state.user

		if (this.state.isNotExistent) {
			return (
				<antd.Result
					status="404"
					title="This user does not exist, yet..."
				></antd.Result>
			)
		}

		if (!user) {
			return <antd.Skeleton active />
		}

		return (
			<div
				id="profile"
				className={classnames("account-profile", {
					["withCover"]: user.cover,
				})}
			>
				{user.cover && (
					<div
						className={classnames("cover", {
							["expanded"]: this.state.coverExpanded,
						})}
						style={{ backgroundImage: `url("${user.cover}")` }}
						onClick={() => this.toggleCoverExpanded()}
						id="profile-cover"
					/>
				)}

				<div className="panels">
					<div className="left-panel">
						<UserCard user={user} />

						<div className="actions">
							<FollowButton
								count={this.state.followersCount}
								onClick={this.onClickFollow}
								followed={this.state.following}
								self={this.state.isSelf}
							/>

							{!this.state.isSelf && (
								<antd.Button
									icon={<Icons.MdMessage />}
									onClick={() =>
										app.location.push(
											`/messages/${user._id}`,
										)
									}
								/>
							)}
						</div>
					</div>

					<div className="center-panel" ref={this.contentRef}>
						<AnimatePresence mode="wait">
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0 }}
								transition={{
									duration: 0.15,
								}}
								key={this.state.tabActiveKey}
								style={{
									width: "100%",
								}}
							>
								{React.createElement(
									TabsComponent[this.state.tabActiveKey],
									{
										onTopVisibility:
											this.onPostListTopVisibility,
										state: this.state,
									},
								)}
							</motion.div>
						</AnimatePresence>
					</div>

					<div className="right-panel">
						<antd.Menu
							className="tabMenu"
							mode={app.isMobile ? "horizontal" : "vertical"}
							selectedKeys={[this.state.tabActiveKey]}
							onClick={(e) => this.handlePageTransition(e.key)}
							items={GenerateMenuItems([
								{
									id: "posts",
									label: "Posts",
									icon: "FiBookOpen",
								},
								{
									id: "music",
									label: "Music",
									icon: "MdAlbum",
								},
								{
									id: "followers",
									label: "Followers",
									icon: "FiUsers",
								},
								{
									id: "details",
									label: "Details",
									icon: "FiInfo",
								},
							])}
						/>
					</div>
				</div>
			</div>
		)
	}
}
