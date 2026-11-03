import type { SoundpadPlayback, SoundpadPlayer } from "@/adapter"

export const webSoundpad: SoundpadPlayer = {
	play({ src, volume = 0.5, onEnded }): SoundpadPlayback {
		const audio = new Audio()

		let stopped = false

		const release = () => {
			audio.onended = null
			audio.onerror = null
		}

		const finish = () => {
			if (stopped) return

			stopped = true
			release()
			onEnded?.()
		}

		audio.onended = finish
		audio.onerror = finish
		audio.src = src
		audio.loop = false
		audio.volume = volume

		audio.play().catch(finish)

		return {
			stop() {
				if (stopped) return

				stopped = true
				release()
				audio.pause()
				audio.currentTime = 0
				onEnded?.()
			},
		}
	},
}

export default webSoundpad
