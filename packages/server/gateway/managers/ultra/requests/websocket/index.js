import upgrade from "./upgrade"
import open from "./open"
import close from "./close"
import message from "./message"

export default class WebsocketProxy {
	constructor(gateway) {
		this.gateway = gateway
	}

	static encode = (data) => {
		if (data instanceof ArrayBuffer || data instanceof Buffer) {
			return data
		}

		return JSON.stringify(data)
	}

	static decode = (data, isBinary = false) => {
		if (data instanceof ArrayBuffer) {
			const decoder = new TextDecoder()
			data = decoder.decode(data)
		}

		data = JSON.parse(data)

		return data
	}

	upgrade = upgrade.bind(this)
	open = open.bind(this)
	close = close.bind(this)
	message = message.bind(this)
}
