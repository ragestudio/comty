import React from "react"
import { Icons } from "@components/Icons"
import Button from "@ui/Button"
import useAckNotifications from "@hooks/useAckNotifications"

import "./index.less"

const NotificationItem = ({ notification }) => {
	if (!notification) {
		return null
	}

	const ackNotf = React.useCallback(() => {
		app.cores.notifications.ack(notification.id)
	}, [notification])

	return (
		<div
			id={notification.id}
			className="notifications-center__item"
		>
			<div className="notifications-center__item__content">
				<h3>{notification.title}</h3>
				<p>{notification.description}</p>
			</div>

			<div className="notifications-center__item__actions">
				<Button
					icon={<Icons.CheckCheck />}
					onClick={ackNotf}
				/>
			</div>
		</div>
	)
}

const NotificationsCenter = (props) => {
	const { pending } = useAckNotifications()
	return (
		<div className="notifications-center">
			<div className="header">
				<h2>Notifications</h2>
				<Button
					icon={<Icons.CircleCheckBig />}
					onClick={app.cores.notifications.ackAll}
				>
					Read all
				</Button>
			</div>

			<div className="content">
				{pending.map((notf) => {
					return (
						<NotificationItem
							key={notf.id}
							notification={notf}
						/>
					)
				})}
			</div>
		</div>
	)
}

export default NotificationsCenter
