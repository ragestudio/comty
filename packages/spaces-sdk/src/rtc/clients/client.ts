import type { RTC } from ".."
import type { VoiceState } from "@comty/shared/types/rtc/voiceState"
import type { Producer } from "../producers/producer"
import type { Consumer } from "../consumers/consumer"
import type { SoundpadDispatch } from "@comty/shared/types/rtc/clientEvent"

import loggerBase from "@/utils/logger"
import { RTC_ClientEvent } from "@comty/shared/types/rtc/events/inbound"

export const logger = loggerBase.child("clients")

export interface SerializedClient {
	userId: Client["userId"]
	voiceState: Client["voiceState"]
	self: Client["self"]
	micConsumerId?: string | null
}

export class Client {
	core: RTC
	logger: typeof logger

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

		this.logger = logger.child(`(${data.userId})`)

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
			logger.error("Cannot attach mic without consumer")
			return
		}

		this.micConsumer = consumer

		this.setState({ micConsumerId: this.micConsumer.id })

		logger.debug(`Attached client mic[${this.userId}]`)
	}

	async dettachMic() {
		if (!this.micConsumer) {
			logger.error("Cannot dettach mic without consumer")
			return
		}

		await this.core.consumers.stop(this.micConsumer.id)
		delete this.micConsumer

		logger.debug(`Detached client mic[${this.userId}]`)
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

	async dispatchSoundpad(payload: RTC_ClientEvent<SoundpadDispatch>) {
		this.logger.debug("dispatched soundpad audio", payload)

		const audio = new Audio()

		audio.onended = () => {
			this.core.eventBus.emit("rtc:vc:soundpad:ended", eventBusPayload)
			this.core.eventBus.emit(
				`rtc:vc:soundpad:${payload.userId}:ended`,
				eventBusPayload,
			)
		}

		audio.src = payload.data.src
		audio.loop = false
		audio.volume = 0.5 // TODO: get value from a persistent store

		const eventBusPayload = {
			userId: payload.userId,
			src: payload.data.src,
			icon: payload.data.icon,
		}

		this.core.eventBus.emit("rtc:vc:soundpad", eventBusPayload)
		this.core.eventBus.emit(
			`rtc:vc:soundpad:${payload.userId}`,
			eventBusPayload,
		)

		await audio.play()

		setTimeout(() => {
			if (!audio.ended) {
				audio.pause()
				audio.currentTime = 0
			}
		}, 10000)
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
