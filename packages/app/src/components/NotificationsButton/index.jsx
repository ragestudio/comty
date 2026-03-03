import { Icons } from "@components/Icons"
import useAckNotifications from "@hooks/useAckNotifications"
import classNames from "classnames"

import "./index.less"

const NotificationsButton = () => {
	const { pending } = useAckNotifications()

	return (
		<div
			className={classNames("notifications_icon", {
				hasPending: Array.isArray(pending) && pending.length > 0,
			})}
		>
			<span>
				<Icons.Bell />
			</span>

			{Array.isArray(pending) && pending.length > 0 && (
				<div className="notifications_icon_indicator">
					<span>{pending.length}</span>
				</div>
			)}
		</div>
	)
}

export default NotificationsButton
