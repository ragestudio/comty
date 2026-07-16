import React from "react"
import classnames from "classnames"
import ReactPlayer from "react-player"

import Attachments from "@components/AttachmentsGrid"
import TimeAgo from "@components/TimeAgo"
import Image from "@components/Image"
import StickerRender from "@components/StickerRender"
import { Icons } from "@components/Icons"

import LinkPreview from "./LinkPreview"
import { useLiveQuery } from "dexie-react-hooks"

import db from "@contexts/WithSpaces/store"
import { ExtendedMessage as Message } from "@contexts/WithSpaces/chat/types"

import "./Line.less"

const messageRegexs = [
	{
		regex:
			/(?:https?:)?(?:\/\/)?(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*?[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/,
		fn: (result: RegExpExecArray) => {
			return (
				<ReactPlayer
					width="50%"
					height="100%"
					style={{
						aspectRatio: "16/9",
						minHeight: "300px",
						borderRadius: "12px",
						overflow: "hidden",
					}}
					url={result[0]}
					controls
					config={{
						youtube: {
							host: "https://youtube-nocookie.com",
						},
					}}
				/>
			)
		},
	},
	{
		regex:
			/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
		fn: (result: RegExpExecArray) => {
			return <LinkPreview url={result[1]} />
		},
	},
	{
		regex: /(@[a-zA-Z0-9_]+)/gi,
		fn: (result: RegExpExecArray) => {
			return (
				<a
					onClick={() =>
						(globalThis as any).app.navigation.goToAccount(result[1].substr(1))
					}
				>
					{result[1]}
				</a>
			)
		},
	},
]

const RenderMessage = ({ messageStr }: { messageStr: string }) => {
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
	}, [messageStr])

	const firstMatch = regexs[0]

	if (firstMatch && typeof firstMatch.fn === "function") {
		return firstMatch.fn(firstMatch.result)
	}

	return <p>{messageStr}</p>
}

interface LineProps {
	data: Message
	headless: boolean
	type?: "group" | "dm"
	onReplyPreviewClick?: (replyToId: string) => void
}

const Line = React.memo(
	({ data, headless, type, onReplyPreviewClick }: LineProps) => {
		const dbUserData = useLiveQuery(() => db.users.get(data.user_id))
		const appUserData =
			(globalThis as any).app?.userData || (window as any).app?.userData

		const replyData = useLiveQuery(async () => {
			if (!data.reply_to_id || !type) return null

			const table = type === "group" ? db.channel_messages : db.direct_messages

			const repliedMsg = await table.get(data.reply_to_id)
			if (!repliedMsg) return null

			const repliedUsr = await db.users.get(repliedMsg.user_id)

			return { message: repliedMsg, user: repliedUsr ?? null }
		}, [data.reply_to_id, type])

		const userData = React.useMemo(() => {
			if (dbUserData) return dbUserData
			if (appUserData && appUserData._id === data.user_id) return appUserData

			return null
		}, [dbUserData, appUserData, data.user_id])

		const handleReplyPreviewClick = React.useCallback(() => {
			if (!data.reply_to_id || typeof onReplyPreviewClick !== "function") return
			onReplyPreviewClick(data.reply_to_id)
		}, [data.reply_to_id, onReplyPreviewClick])

		const isSystemMessage = data.flags?.includes("system")

		if (isSystemMessage) {
			return (
				<div
					data-message-id={data._id}
					className={classnames(
						"channel-chat__timeline__line",
						"channel-chat__timeline__line--system",
					)}
				>
					<div className="channel-chat__timeline__line__content">
						<div className="channel-chat__timeline__line__content__body">
							<p className="channel-chat__timeline__line--system__text">
								{data.message}
							</p>
						</div>
					</div>
				</div>
			)
		}

		return (
			<div
				data-message-id={data._id}
				data-message-user-id={data.user_id ?? "unknown"}
				context-menu="chat-line"
				className={classnames("channel-chat__timeline__line", {
					["headless"]: headless,
					["sending"]: data.status === "sending",
					["error"]: data.status === "error",
				})}
			>
				{!headless && (
					<div className="channel-chat__timeline__line__avatar">
						<Image
							src={userData?.avatar}
							alt={userData?.username}
						/>
					</div>
				)}

				<div className="channel-chat__timeline__line__content">
					{!headless && (
						<div className="channel-chat__timeline__line__content__header">
							<div className="channel-chat__timeline__line__content__header__username">
								<span>
									{userData?.public_name ??
										(userData?.username ? `@${userData?.username}` : "...")}
								</span>

								{userData?.bot && (
									<div className="channel-chat__timeline__line__content__header__username__bot-indicator">
										<span>Bot</span>
									</div>
								)}
							</div>

							<div className="channel-chat__timeline__line__content__header__time">
								{data.status === "sending" ? (
									<Icons.Loader2 className="animate-spin" />
								) : data.status === "error" ? (
									<Icons.AlertCircle className="text-danger" />
								) : (
									<TimeAgo time={data.created_at} />
								)}
							</div>
						</div>
					)}

					{data.message && (
						<div
							className="channel-chat__timeline__line__content__body"
							id="message-content"
						>
							{replyData && (
								<div
									className="channel-chat__timeline__line__content__reply-preview"
									onClick={handleReplyPreviewClick}
								>
									<Icons.Reply className="channel-chat__timeline__line__content__reply-preview__icon" />
									<div className="channel-chat__timeline__line__content__reply-preview__content">
										<span className="channel-chat__timeline__line__content__reply-preview__username">
											{replyData.user?.public_name ??
												(replyData.user?.username
													? `@${replyData.user.username}`
													: "...")}
										</span>
										<span className="channel-chat__timeline__line__content__reply-preview__text">
											{replyData.message.message}
										</span>
									</div>
								</div>
							)}
							<RenderMessage messageStr={data.message} />
						</div>
					)}

					{data.attachments && data.attachments.length > 0 && (
						<Attachments
							attachments={data.attachments as any}
							className="channel-chat__timeline__line__content__body__attachments"
						/>
					)}

					{data.sticker && <StickerRender id={data.sticker} />}
				</div>
			</div>
		)
	},
)

Line.displayName = "Line"

export default Line
