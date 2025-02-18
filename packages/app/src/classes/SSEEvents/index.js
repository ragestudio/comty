export default class SSEEvents {
	constructor(url, events) {
		this.url = url

		for (const [event, handler] of Object.entries(events)) {
			this.handlers.set(event, handler)
		}

		this.eventSource = new EventSource(url)

		this.eventSource.onmessage = (event) => {
			const parsed = JSON.parse(event.data)

			console.debug(`[SSE] Message received`, parsed)

			if (typeof parsed.event !== "string") {
				console.error(`[SSE] Invalid event type: ${parsed.event}`)
				return
			}

			this.trigger(parsed.event, parsed.data)
		}
	}

	handlers = new Map()

	on = (event, fn) => {
		this.handlers.set(event, fn)
	}

	off = (event) => {
		this.handlers.delete(event)
	}

	trigger = (event, data) => {
		const handler = this.handlers.get(event)

		if (handler) {
			handler(data)
		}
	}

	close = () => {
		console.log(`[SSE] Closing connection`)
		this.eventSource.close()
	}
}
