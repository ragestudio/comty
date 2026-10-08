import type { RTC } from ".."
import type { Producer } from "@/rtc/producers/producer"

import RemoteScreen from "./screen"

export class Screens extends Map<string, RemoteScreen> {
	constructor(core: RTC) {
		super()
		this.core = core
	}

	core: RTC

	add(videoProducer: Producer): RemoteScreen | null {
		const userId = videoProducer.userId

		if (!userId) return null

		let screen = this.get(userId)

		if (!screen) {
			screen = new RemoteScreen(this.core, userId)
			this.set(userId, screen)
		}

		screen.setVideoProducer(videoProducer)

		this.syncState()

		return screen
	}

	attachAudio(audioProducer: Producer): void {
		const userId = audioProducer.userId

		if (!userId) return

		// the audio producer can arrive before the video one (the client
		// produces audio first), so create the screen if it does not exist yet
		let screen = this.get(userId)

		if (!screen) {
			screen = new RemoteScreen(this.core, userId)
			this.set(userId, screen)
		}

		screen.setAudioProducer(audioProducer)

		this.syncState()
	}

	async detachAudio(userId: string): Promise<void> {
		await this.get(userId)?.detachAudio()
	}

	async enable(userId: string): Promise<void> {
		await this.get(userId)?.enable()
	}

	async disable(userId: string): Promise<void> {
		await this.get(userId)?.disable()
	}

	async stop(userId: string): Promise<void> {
		await this.get(userId)?.destroy()
	}

	setVolume(userId: string, volume: number): void {
		this.get(userId)?.setVolume(volume)
	}

	async stopAll(): Promise<void> {
		for (const userId of Array.from(this.keys())) {
			await this.stop(userId)
		}
	}

	syncState(): void {
		this.core.setState({
			statedScreens: Array.from(this.values()).map((screen) =>
				screen.serialize(),
			),
		})
	}
}

export default Screens
