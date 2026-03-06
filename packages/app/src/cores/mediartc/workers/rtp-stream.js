const states = new Map()

const PACKET_TIME_THRESHOLD = 200
const DTX_BYTES_THRESHOLD = 100
const DEBOUNCE_TICK_RATE = 100

setInterval(() => {
	const now = Date.now()

	for (const [_, state] of states.entries()) {
		if (
			state.isSpeaking &&
			now - state.lastPacketTime > PACKET_TIME_THRESHOLD
		) {
			state.isSpeaking = false
			postMessage(state)
		}
	}
}, DEBOUNCE_TICK_RATE)

onmessage = async (event) => {
	const { id, type, readableStream, writableStream } = event.data

	const reader = readableStream.getReader()
	const writer = writableStream.getWriter()

	// create a new state for the stream
	states.set(id, {
		id: id,
		type: type,
		isSpeaking: false,
		lastPacketTime: 0,
	})

	try {
		while (true) {
			const { done, value } = await reader.read()

			if (done) {
				break
			}

			if (value.data.byteLength > DTX_BYTES_THRESHOLD) {
				const state = states.get(id)

				state.lastPacketTime = Date.now()

				if (!state.isSpeaking) {
					state.isSpeaking = true
					postMessage(state)
				}
			}

			writer.write(value)
		}
	} catch (e) {
		console.warn(`Closed stream [${id}]`)
	} finally {
		reader.releaseLock()
		writer.releaseLock()
		states.delete(id)
	}
}
