import type { RTC } from ".."
import BaseStream from "./streams/base"
import { MicStream } from "./streams/mic"
import { ScreenStream } from "./streams/screen"

const StreamsKinds = {
	mic: MicStream,
	screen: ScreenStream,
}

type StreamStartParams<Kind extends keyof typeof StreamsKinds> = Parameters<
	ReturnType<(typeof StreamsKinds)[Kind]>["start"]
>[0]

export class Self {
	constructor(core: RTC) {
		this.core = core
	}

	core: RTC
	streams: Set<BaseStream> = new Set()

	async createStream<Kind extends keyof typeof StreamsKinds>(
		kind: Kind,
		params?: StreamStartParams<Kind>,
	) {
		if (!StreamsKinds[kind]) {
			throw new Error(`Stream of kind [${kind}] is not available`)
		}

		const stream = StreamsKinds[kind]()

		await stream.start(params)

		this.streams.add(stream)

		return stream
	}

	async deleteStream<T extends BaseStream<any>>(
		stream: T,
		params?: Parameters<T["close"]>[0],
	) {
		await stream.close(params)
		this.streams.delete(stream)

		return stream
	}
}

export default Self
