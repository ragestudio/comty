import type MediaRTC from "../mediartc.core"

const maxPlaytime = 10000 // 10 seconds

export default async (core: MediaRTC, payload: any) => {
	try {
		core.console.log(
			`User ${payload.userId} dispatched soundpad :`,
			payload.data,
		)

		const audio = new Audio()

		audio.src = payload.data.src
		audio.loop = false
		audio.volume = app.cores.settings.get("mediartc:soundpad:volume") ?? 0.5

		await audio.play()

		const eventBusPayload = {
			userId: payload.userId,
			src: payload.data.src,
			icon: payload.data.icon,
		}

		audio.onended = () => {
			app.eventBus.emit("rtc:vc:soundpad:ended", eventBusPayload)
			app.eventBus.emit(
				`rtc:vc:soundpad:${payload.userId}:ended`,
				eventBusPayload,
			)
		}

		app.eventBus.emit("rtc:vc:soundpad", eventBusPayload)
		app.eventBus.emit(`rtc:vc:soundpad:${payload.userId}`, eventBusPayload)

		setTimeout(() => {
			if (!audio.ended) {
				audio.pause()
				audio.currentTime = 0
			}
		}, maxPlaytime)
	} catch (error) {
		core.console.error("Error dispatching soundpad:", error)
	}
}
