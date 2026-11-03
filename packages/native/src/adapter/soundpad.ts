import { createAudioPlayer } from "expo-audio"
import type { SoundpadPlayback, SoundpadPlayer } from "@comty/spaces-sdk"

export const nativeSoundpad: SoundpadPlayer = {
	play({ src, volume = 0.5, onEnded }): SoundpadPlayback {
		const player = createAudioPlayer({ uri: src }, { downloadFirst: true })

		let stopped = false
		let subscription: { remove(): void } | null = null

		const release = () => {
			subscription?.remove()
			subscription = null

			// defer the release so the player is not removed from its own event
			setTimeout(() => player.remove(), 0)
		}

		const finish = () => {
			if (stopped) return

			stopped = true
			release()
			onEnded?.()
		}

		subscription = player.addListener("playbackStatusUpdate", (status) => {
			if (status.didJustFinish) finish()
		})

		player.volume = volume
		player.play()

		return {
			stop() {
				if (stopped) return

				stopped = true
				player.pause()
				release()
				onEnded?.()
			},
		}
	},
}

export default nativeSoundpad
