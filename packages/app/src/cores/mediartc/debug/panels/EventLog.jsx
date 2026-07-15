import React, { useRef, useEffect } from "react"
import { Card, Tag, Empty } from "antd"

const TYPE_COLORS = {
	"state:change": "blue",
	"eventBus:mediartc:": "green",
}

function getLogColor(type) {
	for (const [prefix, color] of Object.entries(TYPE_COLORS)) {
		if (type.startsWith(prefix)) return color
	}
	return "default"
}

export default function EventLog({ events }) {
	const listRef = useRef(null)

	useEffect(() => {
		if (listRef.current) {
			listRef.current.scrollTop = 0
		}
	}, [events.length])

	if (events.length === 0) {
		return <Empty description="No events captured yet" />
	}

	return (
		<div className="debug-panel">
			<Card
				size="small"
				title={`Event Log (${events.length} entries, latest first)`}
			>
				<div
					ref={listRef}
					style={{
						maxHeight: 500,
						overflow: "auto",
						fontFamily: "monospace",
						fontSize: 11,
						background: "var(--debug-log-bg)",
						color: "var(--debug-log-text)",
						padding: 8,
						borderRadius: 4,
					}}
				>
					{events.map((event) => (
						<div
							key={event.id}
							style={{
								padding: "2px 4px",
								borderBottom:
									"1px solid var(--debug-log-border)",
								lineHeight: 1.4,
							}}
						>
							<span style={{ color: "var(--debug-log-meta)" }}>
								{event.timestamp.toLocaleTimeString()}.
								{String(
									event.timestamp.getMilliseconds(),
								).padStart(3, "0")}
							</span>{" "}
							<Tag
								color={getLogColor(event.type)}
								style={{ fontSize: 10, marginRight: 4 }}
							>
								{event.type}
							</Tag>
							<span>
								{typeof event.data === "object"
									? JSON.stringify(event.data, null, 0)
											.slice(0, 200)
											.replace(/\n/g, " ")
									: String(event.data)}
								{typeof event.data === "object" &&
									JSON.stringify(event.data).length > 200 &&
									"..."}
							</span>
						</div>
					))}
				</div>
			</Card>
		</div>
	)
}
