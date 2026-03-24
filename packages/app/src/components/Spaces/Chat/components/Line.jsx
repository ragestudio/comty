import React from "react"
import PropTypes from "prop-types"
import classnames from "classnames"
import ReactPlayer from "react-player"

import Attachments from "@components/AttachmentsGrid"
import TimeAgo from "@components/TimeAgo"
import Image from "@components/Image"
import StickerRender from "@components/StickerRender"

import LinkPreview from "./LinkPreview"

import "./Line.less"

const messageRegexs = [
	{
		regex: /^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtu(?:be\.com|be)\/(?:shorts\/|live\/|v\/|embed\/|watch(?:\/|\?(?:\S+=\S+&)*v=))?([\w-]{11})(?:\S+)?$/,
		fn: (result) => {
			return (
				<ReactPlayer
					width="100%"
					height="100%"
					style={{
						aspectRatio: "16/9",
						minHeight: "300px",
						borderRadius: "12px",
						overflow: "hidden",
					}}
					url={result[0]}
					controls
				/>
			)
		},
	},
	{
		regex: /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
		fn: (result) => {
			return <LinkPreview url={result[1]} />
		},
	},
	{
		regex: /(@[a-zA-Z0-9_]+)/gi,
		fn: (result) => {
			return (
				<a
					onClick={() =>
						app.navigation.goToAccount(result[1].substr(1))
					}
				>
					{result[1]}
				</a>
			)
		},
	},
]

const RenderMessage = ({ messageStr }) => {
	const regexs = React.useMemo(() => {
		if (!messageRegexs) {
			return []
		}

		return messageRegexs
			.map((option) => {
				const result = option.regex.exec(messageStr)

				if (!result) {
					return null
				}

				return {
					result: result,
					regex: option.regex,
					fn: option.fn,
				}
			})
			.filter((item) => item !== null)
	}, [])

	const firstMatch = regexs[0]

	if (firstMatch && typeof firstMatch.fn === "function") {
		return firstMatch.fn(firstMatch.result)
	}

	return <p>{messageStr}</p>
}

const Line = React.memo(({ data, headless }) => {
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

				{data.message && (
					<div
						className="channel-chat__timeline__line__content__body"
						id="message-content"
					>
						<RenderMessage messageStr={data.message} />
					</div>
				)}

				{data.attachments && data.attachments.length > 0 && (
					<Attachments
						attachments={data.attachments}
						className="channel-chat__timeline__line__content__body__attachments"
					/>
				)}

				{data.sticker && <StickerRender id={data.sticker} />}
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
