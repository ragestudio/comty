import type { ExtendedMessage as Message } from "@comty/spaces-sdk/chat/types"

import React from "react"
import classnames from "classnames"

import Attachments from "@components/AttachmentsGrid"
import TimeAgo from "@components/TimeAgo"
import Image from "@components/Image"
import StickerRender from "@components/StickerRender"
import { Icons } from "@components/Icons"

import MessageContent from "./MessageContent"

import type { ReplyData } from "../hooks/useTimelineReplies"

import "./Line.less"

interface LineProps {
	data: Message
	headless: boolean
	user?: Message["user"] | null
	reply?: ReplyData | null
	onReplyPreviewClick?: (replyToId: string) => void
}

const Line = ({
	data,
	headless,
	user,
	reply,
	onReplyPreviewClick,
}: LineProps) => {
	const appUserData =
		(globalThis as any).app?.userData || (window as any).app?.userData

	const userData =
		user ??
		(appUserData && appUserData._id === data.user_id ? appUserData : null)

	const displayName =
		userData?.public_name ??
		(userData?.username ? `@${userData.username}` : "...")

	const replyData = reply

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
					<div
						className="channel-chat__timeline__line__content__body"
						data-message-content=""
						data-message-text={data.message ?? ""}
					>
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
			data-message-user-name={userData ? displayName : ""}
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
							<span>{displayName}</span>

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

				<div
					className="channel-chat__timeline__line__content__body"
					data-message-content=""
					data-message-text={data.message ?? ""}
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

					{data.message && <MessageContent messageStr={data.message} />}

					{data.attachments && data.attachments.length > 0 && (
						<Attachments
							attachments={data.attachments as any}
							className="channel-chat__timeline__line__content__body__attachments"
						/>
					)}
				</div>

				{data.sticker && <StickerRender id={data.sticker} />}
			</div>
		</div>
	)
}

export const LineMemo = React.memo(
	Line,
	(prev, next) =>
		prev.data === next.data &&
		prev.headless === next.headless &&
		prev.user === next.user &&
		prev.reply === next.reply &&
		prev.onReplyPreviewClick === next.onReplyPreviewClick,
)

LineMemo.displayName = "Line"

export default LineMemo
