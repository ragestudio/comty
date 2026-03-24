import React from "react"

import { DateTime } from "luxon"

const TimeAgo = (props) => {
	const [calculationInterval, setCalculationInterval] = React.useState(null)
	const [text, setText] = React.useState("")

	function formatAsCounter(diffMs) {
		const totalSeconds = Math.floor(diffMs / 1000)
		const hours = Math.floor(totalSeconds / 3600)
		const minutes = Math.floor((totalSeconds % 3600) / 60)
		const seconds = totalSeconds % 60

		return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
	}

	async function calculateRelative() {
		const dateTime = DateTime.fromISO(props.time, {
			locale: app.cores.settings.get("language"),
		})

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

		setCalculationInterval(setInterval(calculateRelative, interval))

		calculateRelative()

		return () => {
			clearInterval(calculationInterval)
		}
	}, [props.counterMode, props.interval])

	return text
}

export default TimeAgo
