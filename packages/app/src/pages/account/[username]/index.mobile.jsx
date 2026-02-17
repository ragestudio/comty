import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { Translation } from "react-i18next"

import Skeleton from "@components/Skeleton"
import { PagePanelWithNavMenu } from "@components/PagePanels"
//import { MobileUserCard } from "@components/UserCard"

import UserModel from "@models/user"
import FollowsModel from "@models/follows"

import DetailsTab from "./tabs/details"
import PostsTab from "./tabs/posts"
import FollowersTab from "./tabs/followers"

import "./index.mobile.less"

const Tabs = [
	{
		key: "posts",
		icon: "Hash",
		label: <Translation>{(t) => t("Posts")}</Translation>,
		component: PostsTab,
	},
	{
		key: "followers",
		icon: "Users",
		label: <Translation>{(t) => t("Followers")}</Translation>,
		component: FollowersTab,
	},
	{
		key: "details",
		icon: "Info",
		label: <Translation>{(t) => t("Details")}</Translation>,
		component: DetailsTab,
	},
]

const Account = ({ params }) => {
	const [requestedUser, setRequestedUser] = React.useState(null)
	const [user, setUser] = React.useState(null)
	const [isSelf, setIsSelf] = React.useState(false)
	const [followers, setFollowers] = React.useState([])
	const [isFollowed, setIsFollowed] = React.useState(false)
	const [tabActiveKey, setTabActiveKey] = React.useState("posts")
	const [isNotExistent, setIsNotExistent] = React.useState(false)

	const loadUserData = async () => {
		const requestedUsername = params.username ?? app.userData.username

		let isSelfUser = false
		let userData = null
		let isFollowedData = false
		let followersData = []

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

			if (!isSelfUser) {
				const followedResult = await FollowsModel.imFollowing(
					userData._id,
				).catch(() => false)

				if (followedResult) {
					isFollowedData = followedResult.isFollowed
				}
			}

			const followersResult = await FollowsModel.getFollowers(
				userData._id,
			).catch(() => false)

			if (followersResult) {
				followersData = followersResult
			}
		}

		setRequestedUser(requestedUsername)
		setUser(userData)
		setIsSelf(isSelfUser)
		setIsFollowed(isFollowedData)
		setFollowers(followersData)
	}

	const toggleFollow = async () => {
		if (isFollowed) {
			const accept = await new Promise((resolve) => {
				antd.Modal.confirm({
					title: <Translation>{(t) => t("Confirm")}</Translation>,
					content: (
						<Translation>
							{(t) =>
								t(
									"Are you sure you want to unfollow this user?",
								)
							}
						</Translation>
					),
					okText: <Translation>{(t) => t("Yes")}</Translation>,
					cancelText: <Translation>{(t) => t("No")}</Translation>,
					onOk: () => {
						resolve(true)
					},
					onCancel: () => {
						resolve(false)
					},
				})
			})

			if (!accept) {
				return false
			}
		}

		const result = await FollowsModel.toggleFollow({
			username: requestedUser,
		}).catch((error) => {
			console.error(error)
			antd.message.error(error.message)
			return false
		})

		setIsFollowed(result.following)
		setFollowers(result.followers)
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
		return <Skeleton />
	}

	const state = {
		requestedUser,
		user,
		followers,
		isSelf,
		isFollowed,
		tabActiveKey,
		isNotExistent,
	}

	return (
		<div className={classnames("_mobile_account-profile")}>
			{/* <MobileUserCard
				user={user}
				isSelf={isSelf}
				isFollowed={isFollowed}
				followers={followers}
				onClickFollow={toggleFollow}
			/>*/}

			<PagePanelWithNavMenu
				tabs={Tabs}
				useSetQueryType
				transition
				tabProps={{
					state: state,
				}}
				onTabChange={() => {
					app.layout.scrollTo({
						top: 0,
					})
				}}
				no_top_padding
			/>
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
