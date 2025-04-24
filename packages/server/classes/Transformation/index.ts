const Handlers = {
	"a-dash": require("./handlers/a-dash").default,
	"mq-hls": require("./handlers/mq-hls").default,
	"img-compress": require("./handlers/img-compress").default,
	"video-compress": require("./handlers/video-compress").default,
}

export type TransformationPayloadType = {
	filePath: string
	workPath: string
	handler: string
	onProgress?: function
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
