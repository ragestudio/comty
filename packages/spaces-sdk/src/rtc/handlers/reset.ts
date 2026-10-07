import type { RTC } from ".."

export async function reset(this: RTC) {
	const errors: any[] = []

	const steps = [
		async () => await this.self.deleteAll(),
		async () => this.transports.closeAll(),
		async () => await this.screens.stopAll(),
		async () => await this.consumers.stopAll(),
		async () => await this.clients.destroyAll(),
		async () => this.producers.clear(),
		async () => {
			this.rtpCapabilities = {}
		},
		async () =>
			this.setState({
				state: "disconnected",
				connectedAt: null,
				channel: null,
				isSpeaking: false,
				statedClients: [],
				speakingClients: [],
				statedScreens: [],
				localScreenStreamURL: null,
				micProducerId: null,
				cameraProducerId: null,
				screenVideoProducerId: null,
				screenAudioProducerId: null,
			}),
	]

	steps.forEach(async (fn) => {
		try {
			await fn()
		} catch (err: any) {
			errors.push(err)
		}
	})

	return errors
}

export default reset
