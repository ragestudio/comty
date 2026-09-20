import aDash from "./handlers/a-dash.js"
import mqHls from "./handlers/mq-hls.js"
import optimize from "./handlers/optimize.js"

const Handlers = {
	"a-dash": aDash,
	"mq-hls": mqHls,
	optimize: optimize,
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
