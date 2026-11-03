import type { RTC } from ".."
import type { VoiceState } from "@comty/shared/types/rtc/voiceState"
import type { Producer } from "../producers/producer"
import type { Consumer } from "../consumers/consumer"
import type { SoundpadDispatch } from "@comty/shared/types/rtc/clientEvent"
import type { RTC_ClientEvent } from "@comty/shared/types/rtc/events/inbound"
import type { SoundpadPlayback } from "@/adapter"

import loggerBase from "@comty/shared/utils/logger"
import adapter from "@/adapter"

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

	constructor(core: RTC, data: Partial<Pick<Client, "userId" | "voiceState">>) {
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

	// per-client playback volume, 0 to 150 like the rest of the voice ui
	setVolume(volume: number): void {
		this.localState.volume = Math.max(0, volume) / 100

		this.applyVolume()
	}

	toggleMute(to?: boolean): void {
		this.localState.muted = to === undefined ? !this.localState.muted : to

		this.applyVolume()
	}

	private applyVolume(): void {
		const track = this.micConsumer?.track

		if (!track) return

		const gain = this.localState.muted ? 0 : this.localState.volume

		adapter.trackVolume?.setVolume(track, gain)
	}

	async attachMic(producer: Producer) {
		// already attached to this producer
		if (this.micConsumer?.producerId === producer.producerId) {
			return
		}

		// a new producer for the same media means the previous one is stale
		if (this.micConsumer) {
			await this.dettachMic()
		}

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

		// route the remote track through the host audio output. on web this is
		// what actually plays the track, on native it just applies the volume
		this.applyVolume()

		this.setState({ micConsumerId: this.micConsumer.id })

		logger.debug(`Attached client mic[${this.userId}]`)
	}

	async dettachMic(producerId?: string) {
		const consumer = this.micConsumer

		if (!consumer) return

		// ignore stale events for a producer we are no longer consuming
		if (producerId && consumer.producerId !== producerId) return

		delete this.micConsumer

		this.setState({ micConsumerId: null })

		await this.core.consumers.stop(consumer.id)

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

		const eventBusPayload = {
			userId: payload.userId,
			src: payload.data.src,
			icon: payload.data.icon,
		}

		const notifyEnded = () => {
			this.core.eventBus.emit("rtc:vc:soundpad:ended", eventBusPayload)
			this.core.eventBus.emit(
				`rtc:vc:soundpad:${payload.userId}:ended`,
				eventBusPayload,
			)
		}

		this.core.eventBus.emit("rtc:vc:soundpad", eventBusPayload)
		this.core.eventBus.emit(
			`rtc:vc:soundpad:${payload.userId}`,
			eventBusPayload,
		)

		const player = adapter.soundpad

		if (!player) {
			logger.debug("soundpad player is not available")

			return
		}

		let finished = false
		let stopTimer: ReturnType<typeof setTimeout> | null = null

		const finish = () => {
			if (finished) return

			finished = true

			if (stopTimer) clearTimeout(stopTimer)

			notifyEnded()
		}

		let playback: SoundpadPlayback | null = null

		try {
			playback = await player.play({
				src: payload.data.src,
				volume: 0.5, // TODO: get value from a persistent store
				onEnded: finish,
			})
		} catch (error) {
			logger.error("failed to play soundpad", error)

			finish()
		}

		if (!playback) return

		// safety stop, a clip must not play forever
		stopTimer = setTimeout(() => {
			playback.stop()
			finish()
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
