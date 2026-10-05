import type { RTC } from ".."
import type { Transport } from "mediasoup-client/types"

import createTransport from "./create"

export class Transports {
	core: RTC
	recv: Transport | null = null
	send: Transport | null = null

	constructor(core: RTC) {
		this.core = core
	}

	async createAll() {
		await this.createSendTransport()
		await this.createRecvTransport()

		return {
			send: this.send,
			recv: this.recv,
		}
	}

	closeAll() {
		this.closeSendTransport()
		this.closeRecvTransport()
	}

	createSendTransport = async () => {
		this.send = await this.createTransport("send")
	}

	createRecvTransport = async () => {
		this.recv = await this.createTransport("recv")
	}

	closeSendTransport = () => {
		if (this.send) {
			this.send.close()
			this.send = null
		}
	}
	closeRecvTransport = () => {
		if (this.recv) {
			this.recv.close()
			this.recv = null
		}
	}

	createTransport = Bind(this, createTransport)
}

export default Transports
