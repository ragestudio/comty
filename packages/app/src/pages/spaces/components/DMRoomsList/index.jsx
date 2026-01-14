import React from "react"
import classnames from "classnames"
import { Result, Skeleton, Empty } from "antd"

import ChatsModel from "@models/chats"

import DMRoomListItem from "../DMRoomListItem"

import "./index.less"

const DMRoomsList = ({ onClickItem, selectedRoom, compact }) => {
	const [L_DMs, R_DMs, E_DMs, M_Dms, MR_Dms, U_Dms] =
		app.cores.api.useRequest(ChatsModel.dm.list)

	const onActivityUpdate = React.useCallback(
		(data) => {
			U_Dms((prev) => {
				const items = [...prev]

				const index = items.findIndex(
					(item) => item._id == data.room_id,
				)

				if (index === -1) {
					items.push(data)
				} else {
					items[index] = {
						...items[index],
						...data,
					}
				}

				return items
			})
		},
		[R_DMs],
	)

	const onClickRoom = React.useCallback(
		(room) => {
			if (room && onClickItem) {
				onClickItem(room)
			}
		},
		[onClickItem],
	)

	React.useEffect(() => {
		app.cores.api.listenEvent("dm:activity:update", onActivityUpdate)

		return () => {
			app.cores.api.unlistenEvent("dm:activity:update", onActivityUpdate)
		}
	}, [])

	if (E_DMs) {
		return (
			<Result
				status="error"
				title="Error"
				subTitle="Failed to load direct messages"
			/>
		)
	}

	if (L_DMs) {
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

	if (R_DMs.length === 0) {
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
			{R_DMs.map((room) => (
				<DMRoomListItem
					key={room._id}
					room={room}
					selected={selectedRoom === room.to_user_id}
					onClick={() => onClickRoom(room)}
					compact={compact}
				/>
			))}
		</div>
	)
}

export default DMRoomsList
