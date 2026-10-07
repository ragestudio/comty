import React from "react"
import { DateTime } from "luxon"

const TimeAgo = (props: {
	time: string | Date
	counterMode?: boolean
	interval?: number
}) => {
	const calculationInterval = React.useRef<NodeJS.Timeout | undefined>(
		undefined,
	)
	const [text, setText] = React.useState<string | null>("")

	function formatAsCounter(diffMs: number) {
		const totalSeconds = Math.floor(diffMs / 1000)
		const hours = Math.floor(totalSeconds / 3600)
		const minutes = Math.floor((totalSeconds % 3600) / 60)
		const seconds = totalSeconds % 60

		return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
	}

	async function calculateRelative() {
		const dateTime = DateTime.fromISO(String(props.time), {
			locale: "en_US",
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

		calculationInterval.current = setInterval(calculateRelative, interval)

		calculateRelative()

		return () => {
			clearInterval(calculationInterval.current)
		}
	}, [props.counterMode, props.interval])

	return text
}

export default TimeAgo
