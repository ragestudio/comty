const maxPlaytime = 10000 // 10 seconds

export default async (core, payload) => {
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
