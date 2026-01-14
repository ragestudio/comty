import classnames from "classnames"

import { Icons } from "@components/Icons"
import TimeAgo from "@components/TimeAgo"

import "./index.less"

const DMRoom = ({ room, onClick, selected, compact }) => {
	if (!room) {
		return null
	}

	const to_user_id = room.to_user_id ?? room.pair_key.split("-")[1]

	return (
		<div
			className={classnames("dmrooms-list__item bg-accent", {
				["selected"]: selected,
				["compact"]: compact,
			})}
			onClick={onClick}
			data-room_id={room._id}
			data-user_id={to_user_id}
		>
			<div className="dmrooms-list__item__icon">
				<img src={room.user?.avatar} />
			</div>

			{!compact && (
				<div className="dmrooms-list__item__content">
					<h3>
						{room.user?.username ??
							room.user?.public_name ??
							"Deleted user"}
					</h3>

					<p
						className={classnames(
							"dmrooms-list__item__content__message",
							{
								["sended"]: room.direction === "outgoing",
							},
						)}
					>
						{room.direction === "outgoing" && <Icons.ArrowUp />}
						{room.direction === "incoming" && <Icons.ArrowDown />}
						{room.short_message}
					</p>
				</div>
			)}

			{!compact && (
				<div className="dmrooms-list__item__extra">
					<TimeAgo time={room.last_message_at} />
				</div>
			)}
		</div>
	)
}

export default DMRoom
