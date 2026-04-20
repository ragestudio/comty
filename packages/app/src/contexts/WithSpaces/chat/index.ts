import React from "react"
import { useChatMessages } from "./useChatMessages"
import { useChatTyping } from "./useChatTyping"
import { useChatSocket } from "./useChatSocket"

import db from "../store"
import { getAdapter } from "./adapters"
import { Message } from "../collections/message"
import sortMessages from "../utils/sortMessages"

import DM_CONFIG from "./configs/dm"
import GROUP_CONFIG from "./configs/group"

const CHAT_CONFIGS: Record<string, any> = {
	group: GROUP_CONFIG,
	dm: DM_CONFIG,
}

function useChat(type: string, params: any, events: any) {
	const config = CHAT_CONFIGS[type]

	if (!config) {
		throw new Error(`invalid chat type: ${type}. must be 'group' or 'dm'`)
	}

	const adapter = React.useMemo(() => getAdapter(type), [type])

	const depKey =
		type === "group"
			? `${type}:${params.group_id}:${params.channel_id}`
			: `${type}:${params.to_user_id}`

	const {
		timeline,
		setTimeline,
		loading,
		initialLoading,
		setInitialLoading,
		hasMore,
		setHasMore,
		error: messagesError,
		setError: setMessagesError,
		load,
		loadBefore,
		loadAfter,
		send: sendMessages,
		handleNewMessage,
		handleMessageDeleted,
		handleMessageUpdated,
		setPausedUpdates,
		pausedUpdates,
		resetMessages,
	} = useChatMessages({
		type: type,
		config: config,
		params: params,
		events: events,
	})

	const { isTyping, usersTyping, typing, handleTypingEvent, resetTyping } =
		useChatTyping(config, params)

	const { error: socketError } = useChatSocket({
		config,
		params,
		depKey,
		onNewMessage: handleNewMessage,
		onMessageUpdated: handleMessageUpdated,
		onMessageDeleted: handleMessageDeleted,
		onTyping: handleTypingEvent,
	})

	const send = React.useCallback(
		(payload: any) => sendMessages(payload, () => typing(false)),
		[sendMessages, typing],
	)

	const initialize = async () => {
		const cachedMessages = await adapter.getCachedMessages(params, 50)
		const lastCachedMessage = cachedMessages.at(0) as Message

		if (type === "group") {
			const lastChannelMessageRef = await db.last_channels_message.get(
				params.channel_id,
			)

			console.log({
				lastChannelMessageRef,
				lastCachedMessage,
			})

			if (
				!lastCachedMessage ||
				parseInt(lastCachedMessage?._id) <
					parseInt(lastChannelMessageRef?._id)
			) {
				console.debug("Cached messages is expired, fetching new...")
				await load()
			} else {
				setTimeline(sortMessages(cachedMessages))
			}
		}

		if (type === "dm") {
			// TODO: lookup the last dm message ref for this room
			await load()
		}
	}

	React.useEffect(() => {
		setInitialLoading(true)
		let isMounted = true

		resetMessages()
		resetTyping()

		initialize()
			.catch((err: any) => {
				if (isMounted) {
					setMessagesError(err)
				}
			})
			.finally(() => {
				if (isMounted) {
					setInitialLoading(false)
				}
			})

		return () => {
			isMounted = false
		}
	}, [
		depKey,
		load,
		resetMessages,
		resetTyping,
		setInitialLoading,
		setMessagesError,
	])

	return {
		initialLoading,
		timeline,
		loading,
		error: messagesError || socketError,
		loadBefore,
		loadAfter,
		load,
		send,
		typing,
		isTyping,
		usersTyping,
		pausedUpdates,
		setPausedUpdates,
		hasMore,
		setHasMore,
	}
}

export default useChat
