const Handlers = {
	"a-dash": require("./handlers/a-dash").default,
	"mq-hls": require("./handlers/mq-hls").default,
	optimize: require("./handlers/optimize").default,
}

export type TransformationPayloadType = {
	filePath: string
	workPath: string
	handler: string
	onProgress?: Function
	capabilities?: {
		encoders: Array<string>
	}
}

class Transformation {
	static async transform(payload: TransformationPayloadType) {
		const handler = Handlers[payload.handler]

		if (typeof handler !== "function") {
			throw new Error(`Invalid handler: ${payload.handler}`)
		}

		return await handler(payload)
	}
}

export default Transformation
