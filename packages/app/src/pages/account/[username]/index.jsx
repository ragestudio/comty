import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { motion, AnimatePresence } from "motion/react"

import { Icons } from "@components/Icons"
import FollowButton from "@components/FollowButton"
import UserCard from "@components/UserCard"

import GenerateMenuItems from "@utils/generateMenuItems"

import useTitle from "@hooks/useTitle"
import useUserData from "@hooks/useUserData"

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
	const { loading, user, setUser, isSelf } = useUserData(params.username)
	const [documentTitle, setDocumentTitle] = useTitle()

	const [tabActiveKey, setTabActiveKey] = React.useState("posts")
	const [coverExpanded, setCoverExpanded] = React.useState(false)
	const contentRef = React.useRef()

	const onClickFollow = React.useCallback(async () => {
		if (!user) {
			return null
		}

		const result = await FollowsModel.toggleFollow({
			user_id: user._id,
		}).catch((error) => {
			console.error(error)
			app.message.error(error.message)
			return false
		})

		if (!result) {
			return null
		}

		// update user data
		setUser((prev) => {
			return {
				...prev,
				following: result.following,
				followers: result.count,
			}
		})
	}, [user])

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

	const toggleCoverExpanded = (to) => {
		setCoverExpanded(to ?? !coverExpanded)
	}

	React.useEffect(() => {
		if (user) {
			setDocumentTitle(user.username)
		}
	}, [user])

	if (loading) {
		return <antd.Skeleton active />
	}

	if (!user) {
		return (
			<antd.Result
				status="404"
				title="This user does not exist, yet..."
			/>
		)
	}

	const tabProps = {
		user: user,
		isSelf: isSelf,
		tabActiveKey: tabActiveKey,
		coverExpanded: coverExpanded,
	}

	return (
		<>
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
								self={isSelf}
								count={user.followers}
								followed={user.following}
								onClick={onClickFollow}
							/>

							{!isSelf && (
								<antd.Button
									icon={<Icons.MessageCircle />}
									onClick={() =>
										app.location.push(
											`/spaces/dm/${user._id}`,
										)
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
								{React.createElement(
									TabsComponent[tabActiveKey],
									{
										state: tabProps,
									},
								)}
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
		</>
	)
}

Account.options = {
	layout: {
		type: "default",
		centeredContent: false,
	},
}

export default Account
