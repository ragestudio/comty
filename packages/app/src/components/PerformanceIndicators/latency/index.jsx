import React from "react"
import * as antd from "antd"

import { createIconRender } from "@components/Icons"

import "./index.less"

const latencyToColor = (latency, type) => {
	switch (type) {
		case "http": {
			if (latency < 200) {
				return "green"
			}
			if (latency < 500) {
				return "orange"
			}
			return "red"
		}
		case "ws": {
			if (latency < 80) {
				return "green"
			}
			if (latency < 120) {
				return "orange"
			}
			return "red"
		}
	}
}

const TypesDecorator = {
	http: {
		label: "HTTP",
		icon: "MdHttp",
	},
	ws: {
		label: "WS",
		icon: "ArrowRightLeft",
	},
}

const LatencyIndicator = (props) => {
	const { type } = props
	const [latencyMs, setLatencyMs] = React.useState("0")

	const decorator = TypesDecorator[type]

	if (!decorator) {
		return null
	}

	function calculateLatency() {
		if (typeof props.calculateLatency === "function") {
			return setLatencyMs(props.calculateLatency())
		}

		app.cores.api
			.measurePing({
				select: [type],
			})
			.then((result) => {
				setLatencyMs(result)
			})
	}

	React.useEffect(() => {
		calculateLatency()

		const interval = setInterval(() => {
			calculateLatency()
		}, props.interval ?? 3000)

		return () => clearInterval(interval)
	}, [])

	return (
		<div className="latencyIndicator">
			{decorator.icon && createIconRender(decorator.icon)}
			{!decorator.icon && (decorator.label ?? "Latency")}
			<antd.Tag color={latencyToColor(latencyMs, type)}>
				{latencyMs}ms
			</antd.Tag>
		</div>
	)
}

export default LatencyIndicator
