import React from "react"
import PropTypes from "prop-types"
import classnames from "classnames"

import Attachments from "@components/AttachmentsGrid"
import TimeAgo from "@components/TimeAgo"
import Image from "@components/Image"
import { processString } from "@utils"

import LinkPreview from "./LinkPreview"

import "./Line.less"

const messageRegexs = [
	{
		regex: /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
		fn: (key, result) => {
			return (
				<LinkPreview
					url={result[1]}
					key={key}
				/>
			)
		},
	},
	{
		regex: /(@[a-zA-Z0-9_]+)/gi,
		fn: (key, result) => {
			return (
				<a
					key={key}
					onClick={() =>
						window.app.location.push(`/@${result[1].substr(1)}`)
					}
				>
					{result[1]}
				</a>
			)
		},
	},
]

const Line = React.memo(({ data, headless }) => {
	const processedMessage = React.useMemo(() => {
		return processString(messageRegexs)(data.message ?? "")
	}, [data.message])

	return (
		<div
			data-message-id={data._id}
			data-message-user-id={data.user?._id ?? "unknown"}
			context-menu="chat-line"
			className={classnames("channel-chat__timeline__line", {
				["headless"]: headless,
			})}
		>
			{!headless && (
				<div className="channel-chat__timeline__line__avatar">
					<Image
						src={data.user.avatar}
						alt={data.user.username}
					/>
				</div>
			)}

			<div className="channel-chat__timeline__line__content">
				{!headless && (
					<div className="channel-chat__timeline__line__content__header">
						<div className="channel-chat__timeline__line__content__header__username">
							<span>
								{data.user?.public_name ??
									`@${data.user?.username}`}
							</span>

							{data.user.bot && (
								<div className="channel-chat__timeline__line__content__header__username__bot-indicator">
									<span>Bot</span>
								</div>
							)}
						</div>

						<div className="channel-chat__timeline__line__content__header__time">
							<TimeAgo time={data.created_at} />
						</div>
					</div>
				)}
				<div
					className="channel-chat__timeline__line__content__body"
					id="message-content"
				>
					<p>{processedMessage}</p>
				</div>

				{data.attachments && data.attachments.length > 0 && (
					<Attachments
						attachments={data.attachments}
						className="channel-chat__timeline__line__content__body__attachments"
					/>
				)}
			</div>
		</div>
	)
})

Line.displayName = "Line"

Line.propTypes = {
	data: PropTypes.shape({
		_id: PropTypes.string.isRequired,
		message: PropTypes.string,
		created_at: PropTypes.string.isRequired,
		user: PropTypes.shape({
			username: PropTypes.string.isRequired,
			avatar: PropTypes.string,
			public_name: PropTypes.string,
			bot: PropTypes.bool,
		}).isRequired,
		attachments: PropTypes.array,
	}).isRequired,
	headless: PropTypes.bool.isRequired,
}

export default Line
