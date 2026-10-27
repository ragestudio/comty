import { adapter } from "@/adapter"
import { audioManager } from "@/rtc/audio"
import { audioProcessing } from "@/rtc/audio/processing"

import { webAudioDevicesEvents } from "./audio-devices"
import {
	processMicStream,
	releaseMicStream,
	webAudioProcessing,
} from "./audio-processing"
import { webAudioRouting } from "./audio-routing"
import { webAudioSettingsStorage } from "./audio-settings"
import { sysAudio } from "./sys-audio"
import { rebuildAllTracks, setTrackVolume } from "./track-volume"

let initializing: Promise<void> | null = null

// wires the browser/electron implementations into the spaces sdk. must run
// before any media is captured or played, so the app awaits it during startup
export function initializeRtcAdapter(): Promise<void> {
	if (initializing) return initializing

	adapter.registerAudioSettingsStorage(webAudioSettingsStorage)
	adapter.registerAudioProcessing(webAudioProcessing)
	adapter.registerAudioRouting(webAudioRouting)
	adapter.registerAudioDevicesEvents(webAudioDevicesEvents)

	// publish the available capabilities so the ui can hide unsupported options
	audioProcessing.sync()

	adapter.registerTrackVolume({ setVolume: setTrackVolume })

	adapter.registerMediaStreamReleaser(releaseMicStream)

	adapter.registerMediaStreamProcessor(async (stream, kind) => {
		if (kind !== "mic") return stream

		try {
			return await processMicStream(stream)
		} catch (error) {
			console.error(
				"[spaces-adapter] failed to process mic stream",
				error,
			)
			return stream
		}
	})

	// electron only: loopback capture + native audio output to avoid feedback
	if (sysAudio.supported) {
		adapter.registerSystemAudio(sysAudio)

		sysAudio.subscribe(() => rebuildAllTracks())
	}

	// keep the device list in sync with hardware changes
	audioManager.observe()

	initializing = (async () => {
		if (sysAudio.supported) {
			try {
				await sysAudio.initialize()
			} catch (error) {
				console.error("[spaces-adapter] failed to init sysaudio", error)
			}
		}

		// apply the stored input and output devices
		await audioManager.restore()
	})()

	return initializing
}

export default initializeRtcAdapter

export * from "./audio-context"
export * from "./audio-processing"
export * from "./audio-routing"
export * from "./audio-settings"
export * from "./sys-audio"
export * from "./track-volume"
