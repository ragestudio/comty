import React from "react"
import { notification } from "antd"

export default {
	error: (...context) => {
		notification.error(context)
	},
}
