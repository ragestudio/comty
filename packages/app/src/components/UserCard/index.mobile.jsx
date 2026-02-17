import classnames from "classnames"

import { Icons } from "@components/Icons"
import { Image, UserBadges } from "@components"

const UserCard = (props, ref) => {
	return (
		<div
			ref={ref}
			className={classnames("_mobile_userCard", {
				["no-cover"]: !props.user.cover,
			})}
		>
			<div className="_mobile_userCard_top">
				{props.user.cover && (
					<div className="_mobile_userCard_top_cover">
						<div
							className="cover"
							style={{
								backgroundImage: `url("${props.user.cover}")`,
							}}
						/>

						<div className="_mobile_userCard_top_avatar_wrapper">
							<div className="_mobile_userCard_top_avatar">
								<Image src={props.user.avatar} />
							</div>
						</div>
					</div>
				)}

				{!props.user.cover && (
					<div className="_mobile_userCard_top_avatar">
						<Image src={props.user.avatar} />
					</div>
				)}

				<div className="_mobile_userCard_top_texts">
					<div className="_mobile_userCard_top_username">
						<h1>
							{props.user.fullName ?? `@${props.user.username}`}
							{props.user.verified && (
								<Icons.BadgeCheck id="verification_tick" />
							)}
						</h1>

						{props.user.fullName && (
							<span>@{props.user.username}</span>
						)}
					</div>

					<div className="_mobile_userCard_top_badges_wrapper">
						{props.user.badges?.length > 0 && (
							<UserBadges user_id={props.user._id} />
						)}
					</div>

					<div className="_mobile_userCard_top_description">
						<p>{props.user.description}</p>
					</div>
				</div>

				{props.user.links &&
					Array.isArray(props.user.links) &&
					props.user.links.length > 0 && (
						<div className={classnames("_mobile_userCard_links")}>
							{props.user.links.map((link, index) => {
								return (
									<UserLink
										index={index}
										link={link}
									/>
								)
							})}
						</div>
					)}
			</div>

			{/* <div
				className={classnames(
					"_mobile_card",
					"_mobile_userCard_actions",
				)}
			>
				{props.followers && (
					<FollowButton
						count={props.followers.length}
						onClick={props.onClickFollow}
						followed={props.isFollowed}
						self={props.isSelf}
					/>
				)}

				<antd.Button
					icon={<Icons.MessageCircle />}
					onClick={() =>
						app.location.push(`/messages/${props.user._id}`)
					}
				/>

				<antd.Button icon={<Icons.Share />} />
			</div>*/}
		</div>
	)
}

export default UserCard
