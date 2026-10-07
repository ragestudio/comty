import type { RTC } from "@/rtc"

export default async function (this: RTC, payload: any) {
	try {
		console.log(
			`User ${payload.userId} dispatched soundpad :`,
			payload.data,
		)

		const audio = new Audio()

		audio.src = payload.data.src
		audio.loop = false
		audio.volume = 0.5 // TODO: get value from a persistent store

		await audio.play()

		const eventBusPayload = {
			userId: payload.userId,
			src: payload.data.src,
			icon: payload.data.icon,
		}

		audio.onended = () => {
			this.eventBus.emit("rtc:vc:soundpad:ended", eventBusPayload)
			this.eventBus.emit(
				`rtc:vc:soundpad:${payload.userId}:ended`,
				eventBusPayload,
			)
		}

		this.eventBus.emit("rtc:vc:soundpad", eventBusPayload)
		this.eventBus.emit(`rtc:vc:soundpad:${payload.userId}`, eventBusPayload)

		setTimeout(() => {
			if (!audio.ended) {
				audio.pause()
				audio.currentTime = 0
			}
		}, 10000) // TODO: get value from a persistent store
	} catch (error) {
		console.error("Error dispatching soundpad:", error)
	}
}
