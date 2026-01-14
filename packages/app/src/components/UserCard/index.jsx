import React from "react"

import { Icons } from "@components/Icons"
import Image from "@components/Image"
import UserLink from "@components/UserLink"
import UserBadges from "@components/UserBadges"

import { open as openCardViewer } from "@components/ProfileCardViewer"

import "./index.less"

const UserCard = (props) => {
	const [user, setUser] = React.useState(props.user)

	if (!user) {
		return null
	}

	const decorations = user.decorations ?? {}

	React.useEffect(() => {
		setUser(props.user)
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
					<Image
						src={user.avatar}
						onDoubleClick={() =>
							openCardViewer({ user, decorations, followers: 0 })
						}
					/>

					{decorations?.avatar_frame && (
						<img
							className="avatar__frame"
							src={decorations.avatar_frame.obj_url}
							style={decorations.avatar_frame.style}
						/>
					)}
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
