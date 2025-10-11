import React from "react"

import { Icons } from "@components/Icons"
import Image from "@components/Image"
import UserLink from "@components/UserLink"
import UserBadges from "@components/UserBadges"

import DecorationsModel from "@models/decorations"

import "./index.less"

const UserCard = (props) => {
	const [user, setUser] = React.useState(props.user)
	const [decorations, setDecorations] = React.useState({})

	const loadDecorations = React.useCallback(async () => {
		if (!props.user || !props.user.decorations) {
			setDecorations({})
			return null
		}

		const data = await DecorationsModel.data(
			Object.values(props.user.decorations),
		).catch((err) => {
			console.error(err)
			return null
		})

		if (data) {
			let obj = {}

			for (const [key, value] of Object.entries(props.user.decorations)) {
				obj[key] = data.find((item) => item._id === value)
			}

			setDecorations(obj)
		}
	}, [props.user])

	React.useEffect(() => {
		setUser(props.user)
		loadDecorations()
	}, [props])

	return (
		<div
			className="userCard bg-accent"
			style={{
				...decorations?.user_card_bg?.card_style,
			}}
		>
			{decorations?.user_card_bg?.image_obj && (
				<div
					className="userCard__img-bg"
					style={{
						backgroundImage: `url('${decorations?.user_card_bg?.image_obj}')`,
						...decorations?.user_card_bg?.image_obj_style,
					}}
				/>
			)}

			{decorations?.user_card_bg?.gradient_obj && (
				<div
					className="userCard__gradient-bg"
					style={{
						...decorations?.user_card_bg?.gradient_obj,
					}}
				/>
			)}

			<div className="username">
				<div className="avatar">
					<Image src={user.avatar} />
				</div>

				<div className="username_text">
					<h1>
						{user.bot && <Icons.Bot />}
						{user.public_name || user.username}
						{user.verified && <Icons.BadgeCheck id="verified" />}
					</h1>
					<span>@{user.username}</span>

					{user.badges?.length > 0 && (
						<UserBadges badges={user.badges} />
					)}
				</div>
			</div>

			{user.description && (
				<div className="description">
					<span>{user.description}</span>
				</div>
			)}

			{user.links &&
				Array.isArray(user.links) &&
				user.links.length > 0 && (
					<div className="userLinks">
						{user.links.map((link, index) => {
							return (
								<UserLink
									key={index}
									index={index}
									link={link}
								/>
							)
						})}
					</div>
				)}
		</div>
	)
}

export default UserCard
