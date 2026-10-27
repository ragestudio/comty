import type { ExtendedMessage as Message } from "@comty/spaces-sdk/chat/types"

import React from "react"
import { Skeleton } from "antd"

import { useChatPagination, useChatTimeline } from "@comty/spaces-sdk/chat"

import Line from "./Line"
import TypingIndicator from "./TypingIndicator"
import JumpToBottom from "./JumpToBottom"

import useChatScroll from "../hooks/useChatScroll"
import useTimelineUsers from "../hooks/useTimelineUsers"
import useTimelineReplies from "../hooks/useTimelineReplies"
import { shouldMergeWithNextItem } from "../utils"

interface TimelineProps {
	channelKey: string
	type: "group" | "dm"
	onLoadBefore: () => void
	onLoadAfter: () => void
	onLoadAround: (messageId: string) => Promise<void>
	onPausedChange: (paused: boolean) => void
}

const Timeline = ({
	channelKey,
	type,
	onLoadBefore,
	onLoadAfter,
	onLoadAround,
	onPausedChange,
}: TimelineProps) => {
	const timeline: Message[] = useChatTimeline()
	const {
		loading,
		loadingAfter,
		afterLoadVersion,
		initialLoading,
		hasMoreBefore,
	} = useChatPagination()
	const users = useTimelineUsers(timeline)
	const replies = useTimelineReplies(timeline, type)

	const groupedTimeline = React.useMemo(
		() =>
			timeline.map((item, index) => ({
				item,
				headless: shouldMergeWithNextItem(timeline[index + 1], item),
			})),
		[timeline],
	)
	const {
		setTimelineRef,
		topTriggerRef,
		showScrollToBottom,
		scrollToBottom,
		scrollToMessage,
	} = useChatScroll({
		channelKey,
		initialLoading,
		loading,
		loadingAfter,
		afterLoadVersion,
		hasMoreBefore,
		timelineLength: timeline.length,
		newestMessageId: timeline[0]?._id,
		onLoadBefore,
		onLoadAfter,
		onPausedChange,
	})

	const jumpToMessage = React.useCallback(
		async (messageId: string) => {
			if (scrollToMessage(messageId)) return

			await onLoadAround(messageId)

			// wait for react to render the new messages
			await new Promise((resolve) => requestAnimationFrame(resolve))
			await new Promise((resolve) => requestAnimationFrame(resolve))

			scrollToMessage(messageId)
		},
		[onLoadAround, scrollToMessage],
	)

	const handleReplyPreviewClick = React.useCallback(
		(replyToId: string) => {
			jumpToMessage(replyToId)
		},
		[jumpToMessage],
	)

	return (
		<div className="channel-chat__wrapper bg-accent">
			<div
				id="chat-timeline"
				className="channel-chat__wrapper__timeline"
				ref={setTimelineRef}
			>
				<TypingIndicator />

				{groupedTimeline.map(({ item, headless }) => (
					<Line
						key={item._id}
						data={item}
						headless={headless}
						user={item.user_id ? (users[item.user_id] ?? item.user) : item.user}
						reply={item.reply_to_id ? replies[item.reply_to_id] : undefined}
						onReplyPreviewClick={handleReplyPreviewClick}
					/>
				))}

				<div
					className="channel-chat__timeline__top-trigger"
					data-chat-top-trigger=""
					ref={topTriggerRef}
				>
					{loading && <Skeleton avatar />}
				</div>
			</div>

			<JumpToBottom
				visible={showScrollToBottom}
				onClick={scrollToBottom}
			/>
		</div>
	)
}

export default Timeline
