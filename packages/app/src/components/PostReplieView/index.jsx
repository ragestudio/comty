import React from "react"

import Image from "@components/Image"
import { Icons } from "@components/Icons"

import "./index.less"

const PostReplieView = (props) => {
	const { data } = props

	if (!data) {
		return null
	}

	return (
		<div
			className="post-replie-view"
			onClick={() => app.navigation.goToPost(data._id)}
		>
			<div className="user">
				<Image
					src={data.user.avatar}
					alt={data.user.username}
				/>

				<span>
					{data.user.public_name ?? `@${data.user.username}`}

					{data.user.verified && <Icons.BadgeCheck />}
				</span>
			</div>

			<div className="content">
				<span>
					{data.message}

					{data.message.length === 0 &&
						data.attachments.length > 0 && (
							<>
								<Icons.Paperclip />
								Image
							</>
						)}
				</span>
			</div>
		</div>
	)
}

export default PostReplieView
