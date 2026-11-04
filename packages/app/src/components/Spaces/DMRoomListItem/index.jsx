import classnames from "classnames"
import { useInView } from "react-intersection-observer"

import TimeAgo from "@components/TimeAgo"
import Image from "@components/Image"

import { useUser, useUsersPresence } from "@comty/spaces-sdk/users"

import "./index.less"

const resolveToUserId = (room) => {
	if (!room) return null

	if (room.to_user_id) return room.to_user_id

	if (typeof room.pair_key === "string") {
		return room.pair_key.split("-")[1] ?? null
	}

	return null
}

const DMRoomListItem = ({ room, onClick, selected, compact }) => {
	const to_user_id = resolveToUserId(room)

	// only visible items load profiles and keep presence subscriptions alive
	const { ref, inView } = useInView({
		rootMargin: "200px 0px",
		triggerOnce: false,
	})

	const storedUser = useUser(to_user_id, { enabled: inView })
	const presence = useUsersPresence(to_user_id, { enabled: inView })

	if (!room || !to_user_id) {
		return null
	}

	const user = storedUser ?? room.user
	const displayName = user?.public_name ?? user?.username ?? "Deleted account"
	const connected = presence[to_user_id]

	return (
		<div
			ref={ref}
			className={classnames("dmrooms-list__item bg-accent", {
				["selected"]: selected,
				["compact"]: compact,
			})}
			onClick={onClick}
			data-room_id={room._id}
			data-user_id={to_user_id}
		>
			<div className="dmrooms-list__item__icon">
				<div className="dmrooms-list__item__icon__image">
					<Image
						src={user?.avatar}
						alt={displayName}
					/>
				</div>

				{typeof connected === "boolean" && (
					<span
						className={classnames("dmrooms-list__item__presence", {
							online: connected,
						})}
					/>
				)}
			</div>

			{!compact && (
				<div className="dmrooms-list__item__content">
					<span>{displayName}</span>

					{/* {room.short_message && (
						<span className="dmrooms-list__item__content__message">
							{room.short_message}
						</span>
					)}*/}
				</div>
			)}

			{!compact && room.last_message_at && (
				<div className="dmrooms-list__item__extra">
					<TimeAgo time={room.last_message_at} />
				</div>
			)}
		</div>
	)
}

export default DMRoomListItem
