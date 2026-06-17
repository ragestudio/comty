import React from "react"
import { notification, message } from "antd"

export const NotificationsRenderer = (props) => {
	const [notfApi, notfContextHolder] = notification.useNotification()
	const [mesApi, mesContextHolder] = message.useMessage()

	React.useEffect(() => {
		if (props.ref) {
			props.ref.current = { notification: notfApi, message: mesApi }
		}
	}, [props.ref])

	return (
		<>
			{notfContextHolder}
			{mesContextHolder}
			{props.children}
		</>
	)
}

export default NotificationsRenderer
