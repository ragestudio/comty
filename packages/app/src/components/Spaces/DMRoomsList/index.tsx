import type { SpacesUser } from "@comty/spaces-sdk/users"

import React from "react"
import classnames from "classnames"
import { Result, Skeleton, Empty } from "antd"

import ChatsModel from "@endpoints/chats"
import client from "comty.js/core/client"

import DMRoomListItem from "@components/Spaces/DMRoomListItem"

import "./index.less"

export interface DMRoomActivity {
	room_id?: string
	user_id?: string
	to_user_id?: string
	last_message_at?: string | Date
	short_message?: string
	direction?: string
}

export interface DMRoom {
	_id: string
	pair_key?: string
	to_user_id?: string
	user?: SpacesUser
	last_message_at?: string | Date
	short_message?: string
	direction?: string
}

interface DMRoomsListProps {
	onClickItem?: (room: DMRoom) => void
	selectedRoom?: string | null
	compact?: boolean
}

const sortRooms = (rooms: DMRoom[]): DMRoom[] =>
	[...rooms].sort((a, b) => {
		const left = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
		const right = b.last_message_at ? new Date(b.last_message_at).getTime() : 0

		return right - left
	})

export const getRoomUserId = (room: DMRoom): string | undefined => {
	if (room.to_user_id) return room.to_user_id

	if (typeof room.pair_key === "string") {
		return room.pair_key.split("-")[1] ?? undefined
	}

	return undefined
}

const DMRoomsList = ({
	onClickItem,
	selectedRoom,
	compact,
}: DMRoomsListProps) => {
	const [rooms, setRooms] = React.useState<DMRoom[]>([])
	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState<Error | null>(null)

	React.useEffect(() => {
		let cancelled = false

		ChatsModel.dm
			.list()
			.then((data) => {
				if (cancelled) return

				setRooms(Array.isArray(data) ? (data as DMRoom[]) : [])
			})
			.catch((err) => {
				if (cancelled) return

				console.error(err)
				setError(err as Error)
			})
			.finally(() => {
				if (cancelled) return

				setLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [])

	const onActivityUpdate = React.useCallback((data: DMRoomActivity) => {
		if (!data?.room_id) return

		const roomId = data.room_id

		setRooms((prev) => {
			const items = [...prev]
			const index = items.findIndex((item) => item._id === roomId)

			const room: DMRoom = {
				...(index !== -1 ? items[index] : { _id: roomId }),
				...data,
				// the activity payload has no room `_id`, keep it explicit
				_id: roomId,
			}

			if (index === -1) {
				items.push(room)
			} else {
				items[index] = room
			}

			return sortRooms(items)
		})
	}, [])

	const onClickRoom = React.useCallback(
		(room: DMRoom) => {
			if (onClickItem) {
				onClickItem(room)
			}
		},
		[onClickItem],
	)

	React.useEffect(() => {
		const socket = client.ws.get("main")

		socket?.on("dm:activity:update", onActivityUpdate)

		return () => {
			socket?.off("dm:activity:update", onActivityUpdate)
		}
	}, [onActivityUpdate])

	if (error) {
		return (
			<Result
				status="error"
				title="Error"
				subTitle="Failed to load direct messages"
			/>
		)
	}

	if (loading) {
		return (
			<div
				className={classnames("dmrooms-list", {
					["compact"]: compact,
				})}
			>
				<Skeleton active />
			</div>
		)
	}

	if (rooms.length === 0) {
		return (
			<div
				className={classnames("dmrooms-list", {
					["compact"]: compact,
				})}
			>
				<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
			</div>
		)
	}

	return (
		<div
			className={classnames("dmrooms-list", {
				["compact"]: compact,
			})}
		>
			{rooms.map((room) => {
				const to_user_id = getRoomUserId(room)

				return (
					<DMRoomListItem
						key={room._id ?? to_user_id}
						room={room}
						selected={selectedRoom === to_user_id}
						compact={compact}
						onClick={() => onClickRoom(room)}
					/>
				)
			})}
		</div>
	)
}

export default DMRoomsList
