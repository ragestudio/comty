import React from "react"

import { DateTime } from "luxon"

const TimeAgo = (props) => {
	const [text, setText] = React.useState("")

	function formatAsCounter(diffMs) {
		const totalSeconds = Math.floor(diffMs / 1000)
		const hours = Math.floor(totalSeconds / 3600)
		const minutes = Math.floor((totalSeconds % 3600) / 60)
		const seconds = totalSeconds % 60

		return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
	}

	function calculateRelative() {
		const options = {
			locale: app.cores.settings.get("language"),
		}

		const dateTime =
			props.time instanceof Date
				? DateTime.fromJSDate(props.time, options)
				: typeof props.time === "number"
					? DateTime.fromMillis(props.time, options)
					: DateTime.fromISO(props.time ?? "", options)

		if (props.counterMode) {
			const now = DateTime.now()
			const diffMs = now.diff(dateTime).milliseconds
			setText(formatAsCounter(diffMs))
		} else {
			setText(dateTime.toRelative())
		}
	}

	React.useEffect(() => {
		const interval = props.counterMode
			? (props.interval ?? 1000)
			: (props.interval ?? 3000)

		const timer = setInterval(calculateRelative, interval)

		calculateRelative()

		return () => clearInterval(timer)
	}, [props.time, props.counterMode, props.interval])

	return text
}

export default TimeAgo
