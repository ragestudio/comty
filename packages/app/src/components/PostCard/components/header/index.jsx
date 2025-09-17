import React from "react"
import { DateTime } from "luxon"
import { Tag } from "antd"

import TimeAgo from "@components/TimeAgo"
import Image from "@components/Image"
import { Icons } from "@components/Icons"

import PostReplieView from "@components/PostReplieView"

import "./index.less"

const PostCardHeader = (props) => {
	const goToProfile = () => {
		app.navigation.goToAccount(props.postData.user?.username)
	}

	return (
		<div
			className="post-header"
			onDoubleClick={props.onDoubleClick}
		>
			{!props.disableReplyTag && props.postData.reply_to && (
				<div className="post-header-replied_to">
					<div className="post-header-replied_to-label">
						<Icons.Repeat2 />

						<span>Replied to</span>
					</div>

					<PostReplieView data={props.postData.reply_to_data} />
				</div>
			)}

			<div className="post-header-user">
				<div className="post-header-user-avatar">
					<Image
						alt="Avatar"
						src={props.postData.user?.avatar}
					/>
				</div>

				<div className="post-header-user-info">
					<div className="post-header-user-info-label">
						<div className="post-header-user-info-label-left">
							<h1 onClick={goToProfile}>
								{props.postData.user?.public_name ??
									`@${props.postData.user?.username}`}

								{props.postData.user?.verified && (
									<Icons.BadgeCheck id="verified-badge" />
								)}
							</h1>
						</div>

						<div className="post-header-user-info-label-right">
							{props.postData.visibility === "private" && (
								<span>
									<Icons.EyeOff /> Private
								</span>
							)}
							{props.postData.flags?.includes("nsfw") && (
								<Tag color="volcano">NSFW</Tag>
							)}
						</div>
					</div>

					<span className="post-header-user-info-timeago">
						<TimeAgo
							time={
								props.postData.timestamp ??
								props.postData.created_at
							}
						/>
					</span>
				</div>
			</div>
		</div>
	)
}

export default PostCardHeader
