import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { motion, AnimatePresence } from "motion/react"

import { Icons } from "@components/Icons"
import FollowButton from "@components/FollowButton"
import UserCard from "@components/UserCard"

import GenerateMenuItems from "@utils/generateMenuItems"

import UserModel from "@models/user"
import FollowsModel from "@models/follows"

import DetailsTab from "./tabs/details"
import PostsTab from "./tabs/posts"
import FollowersTab from "./tabs/followers"

import "./index.less"

const TabsComponent = {
	posts: PostsTab,
	followers: FollowersTab,
	details: DetailsTab,
}

const Account = ({ params }) => {
	const [requestedUser, setRequestedUser] = React.useState(null)
	const [user, setUser] = React.useState(null)
	const [isSelf, setIsSelf] = React.useState(false)
	const [followersCount, setFollowersCount] = React.useState(0)
	const [following, setFollowing] = React.useState(false)
	const [tabActiveKey, setTabActiveKey] = React.useState("posts")
	const [isNotExistent, setIsNotExistent] = React.useState(false)
	const [coverExpanded, setCoverExpanded] = React.useState(false)

	const contentRef = React.useRef()

	const loadUserData = async () => {
		const requestedUsername = params.username ?? app.userData.username

		let isSelfUser = false
		let userData = null
		let followersCountData = 0

		if (requestedUsername != null) {
			if (app.userData.username === requestedUsername) {
				isSelfUser = true
			}

			userData = await UserModel.data({
				username: requestedUsername,
			}).catch((error) => {
				console.error(error)
				return false
			})

			if (!userData) {
				setIsNotExistent(true)
				return false
			}

			console.log(`Loaded User [${userData.username}] :`, userData)

			const followersResult = await FollowsModel.getFollowers(
				userData._id,
			).catch((error) => {
				console.error(error)
				return false
			})

			if (followersResult) {
				followersCountData = followersResult.count
			}
		}

		setIsSelf(isSelfUser)
		setRequestedUser(requestedUsername)
		setUser(userData)
		setFollowing(userData?.following || false)
		setFollowersCount(followersCountData)
	}

	const onClickFollow = async () => {
		const result = await FollowsModel.toggleFollow({
			user_id: user._id,
		}).catch((error) => {
			console.error(error)
			antd.message.error(error.message)
			return false
		})

		setFollowing(result.following)
		setFollowersCount(result.count)
	}

	const toggleCoverExpanded = (to) => {
		setCoverExpanded(to ?? !coverExpanded)
	}

	const handlePageTransition = (key) => {
		if (typeof key !== "string") {
			console.error(
				"Cannot handle page transition. Invalid key, only valid passing string",
				key,
			)
			return
		}

		const normalizedKey = key.toLowerCase()

		if (tabActiveKey === normalizedKey) {
			return false
		}

		setTabActiveKey(normalizedKey)
	}

	React.useEffect(() => {
		loadUserData()
	}, [params.username])

	if (isNotExistent) {
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

	const state = {
		requestedUser,
		user,
		isSelf,
		followersCount,
		following,
		tabActiveKey,
		isNotExistent,
		coverExpanded,
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
						["expanded"]: coverExpanded,
					})}
					style={{ backgroundImage: `url("${user.cover}")` }}
					onClick={() => toggleCoverExpanded()}
					id="profile-cover"
				/>
			)}

			<div className="panels">
				<div className="left-panel">
					<UserCard user={user} />

					<div className="actions bg-accent">
						<FollowButton
							count={followersCount}
							onClick={onClickFollow}
							followed={following}
							self={isSelf}
						/>

						{!isSelf && (
							<antd.Button
								icon={<Icons.MessageCircle />}
								onClick={() =>
									app.location.push(`/messages/${user._id}`)
								}
							/>
						)}
					</div>
				</div>

				<div
					className="center-panel"
					ref={contentRef}
				>
					<AnimatePresence mode="wait">
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0 }}
							transition={{
								duration: 0.15,
							}}
							key={tabActiveKey}
							style={{
								width: "100%",
							}}
						>
							{React.createElement(TabsComponent[tabActiveKey], {
								state: state,
							})}
						</motion.div>
					</AnimatePresence>
				</div>

				<div className="right-panel">
					<antd.Menu
						className="tabMenu"
						mode={app.isMobile ? "horizontal" : "vertical"}
						selectedKeys={[tabActiveKey]}
						onClick={(e) => handlePageTransition(e.key)}
						items={GenerateMenuItems([
							{
								id: "posts",
								label: "Posts",
								icon: "Hash",
							},
							{
								id: "followers",
								label: "Followers",
								icon: "Users",
							},
							{
								id: "details",
								label: "Details",
								icon: "Info",
							},
						])}
					/>
				</div>
			</div>
		</div>
	)
}

Account.options = {
	layout: {
		type: "default",
		centeredContent: false,
	},
}

export default Account
