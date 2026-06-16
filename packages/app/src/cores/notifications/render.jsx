import React from "react"
import { notification } from "antd"

export const NotificationsRenderer = (props) => {
	const [api, contextHolder] = notification.useNotification()

	React.useEffect(() => {
		if (props.ref) {
			props.ref.current = api
		}
	}, [props.ref])

	return (
		<>
			{contextHolder}
			{props.children}
		</>
	)
}

export default NotificationsRenderer
