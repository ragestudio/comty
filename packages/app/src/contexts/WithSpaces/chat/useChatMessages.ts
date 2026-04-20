import React from "react"
import userDataMap from "../helpers/usersDataMap"
import { getAdapter } from "./adapters"
import { getSocket } from "./useChatSocket"
import { Message } from "../collections/message"
import { User } from "../collections/user"
import {
	DeleteMessagePayload,
	LoadMessagesParams,
	T_UseChatMessagesArgs,
} from "../types"

import { cacheUsers } from "../helpers/cache"
import sortMessages from "../utils/sortMessages"

import db from "../store"

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

	const [timeline, setTimeline] = React.useState<any[]>([])
	const [error, setError] = React.useState<Error | null>(null)

	const [hasMore, setHasMore] = React.useState(true)
	const hasMoreRef = React.useRef(true)

	const paramsRef = React.useRef(params)
	const eventsRef = React.useRef(events)
	const pausedUpdatesRef = React.useRef(false)
	const oldestId = React.useRef<string | null>(null)
	const newestId = React.useRef<string | null>(null)

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
		(messages: Message[], position: string) => {
			if (!position) {
				position = "top"
			}

			setTimeline((prev) => {
				if (position === "top") {
					return sortMessages([...prev, ...messages])
				}

				if (position === "bottom") {
					return sortMessages([...messages, ...prev])
				}
			})
		},
		[setTimeline],
	)

	const handleNewMessage = React.useCallback(
		(data: Message) => {
			console.debug("useChat::handleNewMessage", data)

			try {
				adapter.storeMessage(data)
			} catch (err) {
				console.error("failed to store message to local db", err)
			}

			if (!pausedUpdatesRef.current) {
				pushToTimeline([data], "bottom")
			}

			if (typeof eventsRef.current?.onNewMessage === "function") {
				eventsRef.current.onNewMessage(data)
			}
		},
		[type],
	)

	const handleMessageDeleted = React.useCallback(
		(data: DeleteMessagePayload) => {
			console.debug("useChat::handleMessageDeleted", data)

			try {
				adapter.deleteMessage(data._id)
			} catch (err) {
				console.error("failed to delete message from local db", err)
			}

			setTimeline((prev) => prev.filter((msg) => msg._id !== data._id))

			if (typeof eventsRef.current?.onDeletedMessage === "function") {
				eventsRef.current.onDeletedMessage(data)
			}
		},
		[type],
	)

	const handleMessageUpdated = React.useCallback((data: any) => {
		eventsRef.current?.onUpdatedMessage?.(data)
	}, [])

	const send = React.useCallback(
		async (
			{ message, attachments = [], sticker }: any = {},
			stopTyping?: () => void,
		) => {
			if (!message && attachments.length === 0 && !sticker) {
				return null
			}

			const formattedAttachments = attachments.map((att: any) =>
				typeof att === "string"
					? { url: att }
					: { url: att.url, hash: att.hash },
			)

			const data = config.params.send(paramsRef.current, {
				message,
				attachments: formattedAttachments,
				sticker,
			})

			if (socket) {
				await socket.call(config.methods.send, data)
			}

			if (stopTyping) {
				stopTyping()
			}

			return true
		},
		[config],
	)

	const load = React.useCallback(
		async ({ beforeId, afterId, limit = 30 }: LoadMessagesParams = {}) => {
			if (loadingRef.current === true) {
				console.warn("Waiting to finish loading messages...")
				return
			}

			if (afterId && beforeId) {
				throw new Error(
					"only one of beforeId or afterId can be provided",
				)
			}

			setLoading(true)
			loadingRef.current = true

			try {
				const currentParams = paramsRef.current
				const adapter = getAdapter(type)

				let data: {
					items: Message[]
					users: User[]
				} = {
					items: [],
					users: [],
				}

				const cachedMessages = await adapter.getCachedMessages(
					currentParams,
					limit,
					beforeId,
					afterId,
				)

				let isCacheInvalidated = await adapter.invalidateCache(
					cachedMessages,
					beforeId,
					afterId,
					{
						channel_id: currentParams.channel_id,
					},
				)

				if (isCacheInvalidated) {
					console.time("useChat::load::apiFetchMessages")
					const response = await config.model.get(currentParams, {
						limit: limit,
						beforeId,
						afterId,
					})
					console.timeEnd("useChat::load::apiFetchMessages")

					if (response.items.length > 0) {
						// cache users from api
						if (response.users) {
							await cacheUsers(response.users)
						}

						data.items = response.items

						try {
							await adapter.cacheMessages(data.items)
						} catch (error) {
							console.error("failed to cache messages:", error)
						}
					} else {
						setHasMore(false)
						hasMoreRef.current = false
					}
				} else {
					data.items = cachedMessages
				}

				if (data.items.length > 0) {
					data.users = await db.users
						.where("_id")
						.anyOf(data.items.map((message) => message.user_id))
						.toArray()
				}

				console.log({ data })
				pushToTimeline(data.items, afterId ? "top" : "bottom")
			} catch (err: any) {
				console.error("error loading historical messages:", err)
				setError(err)
			} finally {
				setLoading(false)
				loadingRef.current = false
			}
		},
		[config, type],
	)

	const loadBefore = React.useCallback(
		(id?: string) => load({ beforeId: id ?? oldestId.current! }),
		[load],
	)

	const loadAfter = React.useCallback(
		(id?: string) => load({ afterId: id ?? newestId.current! }),
		[load],
	)

	const setPausedUpdates = React.useCallback((to: boolean) => {
		pausedUpdatesRef.current = to
	}, [])

	const resetMessages = React.useCallback(() => {
		setTimeline([])
		setInitialLoading(true)

		setLoading(false)
		loadingRef.current = false

		setHasMore(true)
		hasMoreRef.current = true

		setError(null)
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
		send,
		handleNewMessage,
		handleMessageDeleted,
		handleMessageUpdated,
		setPausedUpdates,
		pausedUpdates: pausedUpdatesRef.current,
		resetMessages,
	}
}
