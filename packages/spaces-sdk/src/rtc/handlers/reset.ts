import type { RTC } from ".."

export async function reset(this: RTC) {
	const errors: any[] = []

	const steps = [
		async () => await this.self.deleteAll(),
		async () => this.transports.closeAll(),
		async () => await this.consumers.stopAll(),
		async () => await this.clients.destroyAll(),
		async () => this.producers.clear(),
		async () =>
			this.setState({
				state: "disconnected",
				connectedAt: null,
				channel: null,
				isSpeaking: false,
				statedClients: [],
				speakingClients: [],
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
