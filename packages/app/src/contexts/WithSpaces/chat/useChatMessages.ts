import type { ExtendedMessage as Message, T_UseChatMessagesArgs } from "./types"
import type { DeleteMessagePayload, LoadMessagesParams } from "../types"

import React from "react"
import { getAdapter } from "./adapters"
import { getSocket } from "./useChatSocket"
import { User } from "../collections/user"

import { cacheUsers } from "../helpers/cache"
import sortMessages from "../utils/sortMessages"

import db from "../store"
import ChatsService from "@models/chats"

export function useChatMessages({
	type,
	config,
	params,
	events,
}: T_UseChatMessagesArgs) {
	const socket = React.useMemo(() => getSocket(), [params])
	const adapter = React.useMemo(() => getAdapter(type), [type])

	const [initialLoading, setInitialLoading] = React.useState(true)
	const [loading, setLoading] = React.useState(false)
	const loadingRef = React.useRef(false)

	const [timeline, setTimeline] = React.useState<Message[]>([])
	const [error, setError] = React.useState<Error | null>(null)

	const [hasMore, setHasMore] = React.useState(true)
	const hasMoreRef = React.useRef(true)

	const paramsRef = React.useRef(params)
	const eventsRef = React.useRef(events)
	const pausedUpdatesRef = React.useRef(false)
	const oldestId = React.useRef<string | null>(null)
	const newestId = React.useRef<string | null>(null)

	const chatId = React.useMemo(() => {
		return type === "group" ? params.channel_id : params.to_user_id
	}, [type, params])

	React.useEffect(() => {
		paramsRef.current = params
		eventsRef.current = events
	}, [params, events])

	React.useEffect(() => {
		if (timeline.length > 0) {
			oldestId.current = timeline[timeline.length - 1]._id
			newestId.current = timeline[0]._id
		}
	}, [timeline])

	const pushToTimeline = React.useCallback(
		(messages: Message[], position: "top" | "bottom" = "top") => {
			setTimeline((prev) => {
				const combined = [...prev]

				messages.forEach((msg) => {
					const finalMsg =
						msg.status === "sending" || msg.status === "error"
							? msg
							: { ...msg, status: "sent" as const }

					const index = combined.findIndex(
						(m) =>
							m._id === finalMsg._id ||
							(finalMsg.nonce && m.nonce === finalMsg.nonce),
					)

					if (index !== -1) {
						combined[index] = { ...combined[index], ...finalMsg }
					} else {
						combined.push(finalMsg)
					}
				})

				return sortMessages(combined)
			})
		},
		[setTimeline],
	)

	const handleNewMessage = React.useCallback(
		(data: Message & { user?: User }) => {
			console.debug("useChat::handleNewMessage", data)

			if (data.user) {
				cacheUsers([data.user]).catch(console.error)
			}

			adapter.storeMessage(data).catch(console.error)
			adapter
				.updateSyncState({
					chat_id: chatId,
					last_message_id: data._id,
				})
				.catch(console.error)

			if (!pausedUpdatesRef.current) {
				pushToTimeline([data], "bottom")
			}

			if (typeof eventsRef.current?.onNewMessage === "function") {
				eventsRef.current.onNewMessage(data)
			}
		},
		[type, chatId, adapter, pushToTimeline],
	)

	const handleMessageDeleted = React.useCallback(
		(data: DeleteMessagePayload) => {
			adapter.deleteMessage(data._id).catch(console.error)
			setTimeline((prev) => prev.filter((msg) => msg._id !== data._id))
			eventsRef.current?.onDeletedMessage?.(data)
		},
		[type, adapter],
	)

	const handleMessageUpdated = React.useCallback((data: any) => {
		setTimeline((prev) =>
			prev.map((msg) =>
				msg._id === data._id ? { ...msg, ...data } : msg,
			),
		)

		eventsRef.current?.onUpdatedMessage?.(data)
	}, [])

	const send = React.useCallback(
		async (
			{ message, attachments = [], sticker, reply_to_id }: any = {},
			stopTyping?: () => void,
		) => {
			if (!message && attachments.length === 0 && !sticker) {
				return null
			}

			const nonce = Math.random().toString(36).substring(7)
			const optimisticMessage: Message = {
				_id: `temp-${nonce}`,
				nonce: nonce,
				channel_id:
					type === "group" ? paramsRef.current.channel_id : "",
				user_id: app.userData?._id,
				message: message,
				attachments: attachments,
				sticker: sticker,
				reply_to_id: reply_to_id,
				status: "sending",
				created_at: new Date().toISOString() as any,
			}

			pushToTimeline([optimisticMessage], "bottom")

			const formattedAttachments = attachments.map((att: any) =>
				typeof att === "string"
					? { url: att }
					: { url: att.url, hash: att.hash },
			)

			const data = config.params.send(paramsRef.current, {
				message,
				attachments: formattedAttachments,
				sticker,
				nonce,
				reply_to_id,
			})

			try {
				if (socket) {
					await socket.call(config.methods.send, data)
				}
			} catch (err) {
				console.error("failed to send message", err)
				setTimeline((prev) =>
					prev.map((msg) =>
						msg.nonce === nonce ? { ...msg, status: "error" } : msg,
					),
				)
			}

			if (stopTyping) {
				stopTyping()
			}

			return true
		},
		[config, socket, type, pushToTimeline],
	)

	const sync = React.useCallback(async () => {
		const syncState = await adapter.getSyncState(chatId)
		const lastId = syncState?.last_message_id
		const lastSyncAt = syncState?.last_synced_at || 0

		try {
			const { logs, newMessages, updatedMessages, users } =
				await ChatsService.channels.sync(
					paramsRef.current.group_id,
					paramsRef.current.channel_id,
					{
						last_synced_at: lastSyncAt,
						last_message_id: lastId,
					},
				)

			// Handle Logs (Deletions)
			for (const log of logs) {
				if (log.type === "message:deleted") {
					await adapter.deleteMessage(log.target_id)

					setTimeline((prev) =>
						prev.filter((m) => m._id !== log.target_id),
					)
				}
			}

			// Handle Updated Messages
			if (updatedMessages && updatedMessages.length > 0) {
				await adapter.cacheMessages(updatedMessages)
				pushToTimeline(updatedMessages, "bottom")
			}

			// Handle New Messages
			if (newMessages && newMessages.length > 0) {
				if (users) {
					await cacheUsers(users)
				}

				await adapter.cacheMessages(newMessages)

				pushToTimeline(newMessages, "bottom")

				const newest = newMessages.sort((a: any, b: any) =>
					b._id.localeCompare(a._id),
				)[0]

				await adapter.updateSyncState({
					chat_id: chatId,
					last_message_id: newest._id,
					last_synced_at: Date.now(),
				})
			} else {
				await adapter.updateSyncState({
					chat_id: chatId,
					last_synced_at: Date.now(),
				})
			}
		} catch (err) {
			console.error("Sync failed", err)
		}
	}, [chatId, adapter, pushToTimeline])

	const load = React.useCallback(
		async ({ beforeId, afterId, limit = 30 }: LoadMessagesParams = {}) => {
			if (loadingRef.current) return
			setLoading(true)
			loadingRef.current = true

			try {
				const cached = await adapter.getCachedMessages(
					paramsRef.current,
					limit,
					beforeId,
					afterId,
				)

				if (cached.length > 0) {
					await db.users
						.where("_id")
						.anyOf(cached.map((m) => m.user_id))
						.toArray()

					pushToTimeline(cached, afterId ? "top" : "bottom")
				}

				// If we dont have enough cached or we are explicitly asking for more
				if (cached.length < limit || afterId) {
					const response = await config.model.get(paramsRef.current, {
						limit,
						beforeId,
						afterId,
					})

					if (response.items.length > 0) {
						if (response.users) {
							await cacheUsers(response.users)
						}

						await adapter.cacheMessages(response.items)

						pushToTimeline(
							response.items,
							afterId ? "top" : "bottom",
						)
					} else if (!afterId) {
						setHasMore(false)
						hasMoreRef.current = false
					}
				}
			} catch (err: any) {
				setError(err)
			} finally {
				setLoading(false)
				loadingRef.current = false
			}
		},
		[config, type, adapter, pushToTimeline],
	)

	const loadBefore = React.useCallback(
		(id?: string) => load({ beforeId: id ?? oldestId.current! }),
		[load],
	)

	const loadAfter = React.useCallback(
		(id?: string) => load({ afterId: id ?? newestId.current! }),
		[load],
	)

	const loadAround = React.useCallback(
		async (messageId: string) => {
			if (loadingRef.current) return
			setLoading(true)
			loadingRef.current = true

			try {
				const olderResponse = await config.model.get(
					paramsRef.current,
					{
						beforeId: messageId,
						limit: 15,
					},
				)

				const newerResponse = await config.model.get(
					paramsRef.current,
					{
						afterId: messageId,
						limit: 15,
					},
				)

				const targetMessage =
					type === "group"
						? await db.channel_messages.get(messageId)
						: await db.direct_messages.get(messageId)

				const allMessages = [
					...(olderResponse.items || []),
					...(targetMessage ? [targetMessage] : []),
					...(newerResponse.items || []),
				]

				if (allMessages.length > 0) {
					const users = [
						...(olderResponse.users || []),
						...(newerResponse.users || []),
					]

					if (users.length > 0) {
						await cacheUsers(users)
					}

					await adapter.cacheMessages(allMessages)
					pushToTimeline(allMessages, "bottom")
				}
			} catch (err: any) {
				console.error("loadAround failed", err)
			} finally {
				setLoading(false)
				loadingRef.current = false
			}
		},
		[config, type, adapter, pushToTimeline],
	)

	const resetMessages = React.useCallback(() => {
		setTimeline([])
		setInitialLoading(true)
		setLoading(false)
		loadingRef.current = false
		setHasMore(true)
		hasMoreRef.current = true
		setError(null)
	}, [])

	const setPausedUpdates = React.useCallback((to: boolean) => {
		pausedUpdatesRef.current = to
	}, [])

	return {
		timeline,
		setTimeline,
		loading,
		initialLoading,
		setInitialLoading,
		hasMore,
		setHasMore,
		error,
		setError,
		load,
		loadBefore,
		loadAfter,
		loadAround,
		send,
		sync,
		handleNewMessage,
		handleMessageDeleted,
		handleMessageUpdated,
		setPausedUpdates,
		pausedUpdates: pausedUpdatesRef.current,
		resetMessages,
	}
}
