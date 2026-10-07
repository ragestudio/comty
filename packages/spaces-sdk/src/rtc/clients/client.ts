import type { RTC } from ".."
import type { VoiceState } from "@comty/shared/types/rtc/voiceState"
import type { Producer } from "../producers/producer"
import type { Consumer } from "../consumers/consumer"

export interface SerializedClient {
	userId: Client["userId"]
	voiceState: Client["voiceState"]
	self: Client["self"]
	micConsumerId?: string | null
}

export class Client {
	core: RTC

	constructor(
		core: RTC,
		data: Partial<Pick<Client, "userId" | "voiceState">>,
	) {
		this.core = core

		if (!data.userId) {
			throw new Error("Cannot create Client without userId")
		}

		if (data.userId) {
			this.userId = data.userId
		}

		if (data.voiceState) {
			this.voiceState = data.voiceState
		}

		this.pushToState()
	}

	get self() {
		return this.userId === this.core.userId
	}

	userId!: string
	micConsumer: Consumer | undefined

	voiceState: VoiceState = {
		muted: false,
		deafen: false,
	}

	localState = {
		muted: false,
		volume: 1,
	}

	async attachMic(producer: Producer) {
		const consumer = await this.core.consumers.start({
			kind: "audio",
			producerId: producer.producerId,
			userId: this.userId,
			appData: producer.appData,
		})

		if (!consumer) {
			console.error("Cannot attach mic without consumer")
			return
		}

		this.micConsumer = consumer

		this.setState({ micConsumerId: this.micConsumer.id })

		console.debug(`Attached client mic[${this.userId}]`)
	}

	async dettachMic() {
		if (!this.micConsumer) {
			console.error("Cannot dettach mic without consumer")
			return
		}

		await this.core.consumers.stop(this.micConsumer.id)
		delete this.micConsumer

		console.debug(`Detached client mic[${this.userId}]`)
	}

	async onLeave() {
		if (this.micConsumer) {
			await this.dettachMic()
		}

		this.deleteFromState()
	}

	updateVoiceState(state: VoiceState) {
		this.voiceState = { ...this.voiceState, ...state }

		this.setState({
			voiceState: this.voiceState,
		})
	}

	getAvailableProducers() {
		let producers = []

		for (const [_, producer] of this.core.producers) {
			if (producer.userId === this.userId) {
				producers.push(producer)
			}
		}

		return producers
	}

	serialize(): SerializedClient {
		return {
			userId: this.userId,
			voiceState: this.voiceState,
			micConsumerId: null,
			self: this.self,
		}
	}

	get stateClientIndex() {
		return this.core
			.getState()
			.statedClients.findIndex((c) => c.userId === this.userId)
	}

	getState() {
		return this.core.getState().statedClients[this.stateClientIndex]
	}

	setState(update: Partial<SerializedClient>) {
		this.core.setState((prev) => {
			const statedClients = prev.statedClients.slice()

			statedClients[this.stateClientIndex] = {
				...statedClients[this.stateClientIndex],
				...update,
			}

			return { statedClients }
		})
	}

	pushToState() {
		this.core.setState((prev) => {
			// if already exist, skip
			if (this.stateClientIndex !== -1) {
				return {}
			}

			return { statedClients: [...prev.statedClients, this.serialize()] }
		})
	}

	deleteFromState() {
		this.core.setState((prev) => {
			if (this.stateClientIndex === -1) {
				return {}
			}

			return {
				statedClients: prev.statedClients.filter(
					(client) => client.userId !== this.userId,
				),
			}
		})
	}
}

export default Client
