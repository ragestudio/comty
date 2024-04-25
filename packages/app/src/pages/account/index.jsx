import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Translation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"

import { Icons } from "@components/Icons"
import FollowButton from "@components/FollowButton"
import UserCard from "@components/UserCard"

import { SessionModel, UserModel, FollowsModel } from "@models"

import DetailsTab from "./tabs/details"
import PostsTab from "./tabs/posts"
import MusicTab from "./tabs/music"
import FollowersTab from "./tabs/followers"

import "./index.less"

const TabsComponent = {
	"posts": PostsTab,
	"followers": FollowersTab,
	"details": DetailsTab,
	"music": MusicTab,
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
		const location = window.app.history.location
		const query = new URLSearchParams(location.search)

		const requestedUser = this.props.username ?? location.state?.username ?? query.get("username") ?? token?.username

		let isSelf = false
		let user = null
		let followersCount = 0

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

			const followersResult = await FollowsModel.getFollowers(user._id).catch(() => false)

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
			return <antd.Skeleton active />
		}

		return <div
			className={classnames(
				"accountProfile",
				{
					["withCover"]: user.cover,
				}
			)}
			id="profile"
		>
			{
				user.cover && <div
					className={classnames("cover", {
						["expanded"]: this.state.coverExpanded
					})}
					style={{ backgroundImage: `url("${user.cover}")` }}
					onClick={() => this.toggleCoverExpanded()}
					id="profile-cover"
				/>
			}

			<div className="panels">
				<div className="leftPanel">
					<UserCard
						user={user}
					/>

					<div className="actions">
						<FollowButton
							count={this.state.followersCount}
							onClick={this.onClickFollow}
							followed={this.state.following}
							self={this.state.isSelf}
						/>
					</div>
				</div>

				<div
					className="centerPanel"
					ref={this.contentRef}
				>
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
							{
								React.createElement(TabsComponent[this.state.tabActiveKey], {
									onTopVisibility: this.onPostListTopVisibility,
									state: this.state
								})
							}
						</motion.div>
					</AnimatePresence>
				</div>

				<div className="rightPanel">
					<antd.Menu
						className="tabMenu"
						mode={app.isMobile ? "horizontal" : "vertical"}
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
							key="music"
							icon={<Icons.MdAlbum />}
						>
							<Translation>
								{t => t("Music")}
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