export function getAudioDuration(src: string): Promise<number> {
	return new Promise((resolve, reject) => {
		const audio = new Audio()
		let timeout: number | null = null
		let settled = false

		const cleanup = () => {
			if (timeout !== null) {
				window.clearTimeout(timeout)
				timeout = null
			}

			audio.onloadedmetadata = null
			audio.onerror = null
			audio.src = ""
		}

		const finish = (fn: () => void) => {
			if (settled) return

			settled = true
			cleanup()
			fn()
		}

		timeout = window.setTimeout(() => {
			finish(() => reject(new Error("Timed out while reading the audio")))
		}, 15000)

		audio.preload = "metadata"

		audio.onloadedmetadata = () => {
			const duration = audio.duration

			if (!Number.isFinite(duration) || duration <= 0) {
				finish(() => reject(new Error("Invalid audio duration")))
				return
			}

			finish(() => resolve(duration))
		}

		audio.onerror = () => {
			finish(() => reject(new Error("Failed to read the audio")))
		}

		audio.src = src
	})
}
