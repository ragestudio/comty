import type { ChatParams } from "@comty/spaces-sdk/chat"

import React from "react"
import { Result } from "antd"

import ChatInputBar from "./components/InputBar"
import Timeline from "./components/Timeline"

import { useGroupData } from "@comty/spaces-sdk/group"
import {
	getChatSessionKey,
	useChatStatus,
	useChatActions,
} from "@comty/spaces-sdk/chat"
import { useChatSession } from "@comty/spaces-sdk/chat/session"

import type { ReplyTarget } from "./types"

import "./index.less"

interface ChatProps {
	_id: string
	type?: "group" | "dm"
}

interface ChatInnerProps {
	_id: string
	type: "group" | "dm"
	useChatParam: ChatParams
	sessionKey: string
	groupId?: string
}

const ChatInner = ({
	_id,
	type,
	useChatParam,
	sessionKey,
	groupId,
}: ChatInnerProps) => {
	const chatContainerRef = React.useRef<HTMLDivElement>(null)
	const [replyTo, setReplyTo] = React.useState<ReplyTarget | null>(null)

	const chatStatus = useChatStatus()
	const chatActions = useChatActions()

	useChatSession(type, useChatParam)

	React.useEffect(() => {
		setReplyTo(null)
	}, [sessionKey])

	const handleReplyEvent = React.useCallback((event: Event) => {
		setReplyTo((event as CustomEvent<ReplyTarget>).detail)
	}, [])

	const cancelReply = React.useCallback(() => {
		setReplyTo(null)
	}, [])

	React.useEffect(() => {
		if (chatStatus.initialLoading) return

		const element = chatContainerRef.current
		if (!element) return

		element.addEventListener("chat:reply", handleReplyEvent)

		return () => {
			element.removeEventListener("chat:reply", handleReplyEvent)
		}
	}, [chatStatus.initialLoading, handleReplyEvent])

	if (chatStatus.error) {
		return (
			<Result
				status="warning"
				title="Failed to load messages"
				subTitle={chatStatus.error.message}
			/>
		)
	}

	if (chatStatus.initialLoading || chatStatus.sessionKey !== sessionKey) {
		return null
	}

	return (
		<div
			ref={chatContainerRef}
			className="channel-chat"
			data-is-dm={type === "dm"}
			data-type={type}
			data-channel-id={_id}
			data-group-id={groupId}
		>
			<Timeline
				channelKey={sessionKey}
				type={type}
				onLoadBefore={chatActions.loadBefore}
				onLoadAfter={chatActions.loadAfter}
				onLoadAround={chatActions.loadAround}
				onPausedChange={chatActions.setPausedUpdates}
			/>

			<ChatInputBar
				send={chatActions.send}
				typing={chatActions.typing}
				channel_id={_id}
				replyTo={replyTo}
				onCancelReply={cancelReply}
			/>
		</div>
	)
}

const Chat = ({ _id, type = "group" }: ChatProps) => {
	const data = useGroupData()

	if (!_id || !type) {
		return null
	}

	if (type === "group" && !data) {
		console.error("Chat with type group, must wait for group data")
		return null
	}

	const useChatParam: ChatParams =
		type === "group"
			? { group_id: data!._id, channel_id: _id }
			: { to_user_id: _id }

	const sessionKey = getChatSessionKey(type, useChatParam)

	return (
		<ChatInner
			_id={_id}
			type={type}
			useChatParam={useChatParam}
			sessionKey={sessionKey}
			groupId={type === "group" ? data?._id : undefined}
		/>
	)
}

export default Chat
