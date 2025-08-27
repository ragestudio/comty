import React from "react"
import { Skeleton } from "antd"
import classnames from "classnames"

import Image from "@components/Image"
import { Icons } from "@components/Icons"

import User from "@models/user"

import "./index.less"

const UserPreview = (props) => {
	let [userData, setUserData] = React.useState(props.user)

	const fetchUser = async () => {
		if (!props.user_id && !props.username) {
			console.error("Cannot fetch user data without user_id or username")
			return false
		}

		const data = await User.data({
			user_id: props.user_id,
			username: props.username,
		}).catch((err) => {
			console.error(err)
			app.message.error("Failed to fetch user data")
			return null
		})

		if (data) {
			setUserData(data)
		}
	}

	const handleOnClick = async () => {
		if (typeof props.onClick !== "function") {
			console.warn(
				"UserPreview: onClick is not a function, executing default action",
			)
			return app.navigation.goToAccount(userData.username)
		}

		return await props.onClick(userData)
	}

	React.useEffect(() => {
		if (typeof userData === "undefined") {
			fetchUser()
		}
	}, [])

	if (!userData) {
		return (
			<div className="userPreview">
				<Skeleton.Avatar active />
			</div>
		)
	}

	return (
		<div
			id={userData._id}
			className={classnames("user-preview", {
				["clickable"]: typeof props.onClick === "function",
				["small"]: props.small && !props.big,
				["big"]: props.big && !props.small,
			})}
		>
			<div
				className="user-preview__avatar"
				onClick={handleOnClick}
			>
				<Image
					alt="Avatar"
					src={userData.avatar}
				/>
			</div>

			{!props.onlyIcon && (
				<div
					className="user-preview__info"
					onClick={handleOnClick}
				>
					<h1>
						{userData.public_name ?? userData.username}
						{userData.verified && <Icons.verifiedBadge />}
					</h1>
					<span>@{userData.username}</span>
				</div>
			)}

			{userData.bot && (
				<div className="user-preview__bot">
					<span>Bot</span>
				</div>
			)}
		</div>
	)
}

export default UserPreview
