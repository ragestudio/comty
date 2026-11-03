import session from "comty.js/session"
import { adapter } from "@comty/spaces-sdk"
import { nativeSoundpad } from "@/adapter/soundpad"
import { audioManager, audioProcessing } from "@comty/spaces-sdk/rtc/audio"
import { SecureStoreStorageDriver } from "comty.js/core/storage/secure"
import { registerStorageDriver } from "comty.js/core/storage/storage"
import * as SecureStore from "expo-secure-store"

import { nativeAudioProcessing } from "@/adapter/audioProcessing"
import { initRtcEvents } from "@/adapter/events"

// register a global default driver before the client is used
registerStorageDriver(new SecureStoreStorageDriver(SecureStore))

import {
	registerGlobals as registerRtcGlobals,
	addListener as addRtcListener,
	removeListener as removeRtcListener,
	getAudioDevices,
	setSpeakerphoneOn,
	isSpeakerphoneOn,
	setAudioOutputDevice,
	setAudioInputDevice,
	setAudioRouteMode,
	isBluetoothAvailable,
	resetAudioRoute,
} from "@ragestudio/react-native-webrtc"

adapter.registerFrameTransformEvents({
	addListener: addRtcListener,
	removeListener: removeRtcListener,
})

adapter.registerAudioRouting({
	getAudioDevices,
	setSpeakerphoneOn,
	isSpeakerphoneOn,
	setAudioOutputDevice,
	setAudioInputDevice,
	setAudioRouteMode,
	isBluetoothAvailable,
	resetAudioRouting: resetAudioRoute,
})

adapter.registerAudioDevicesEvents({
	subscribe(handler) {
		const listener = {}
		addRtcListener(listener, "onAudioDevicesChanged", handler)

		return () => removeRtcListener(listener)
	},
})

adapter.registerAudioProcessing(nativeAudioProcessing)

adapter.registerTrackVolume({
	setVolume: (track, gain) => {
		const audioTrack = track as unknown as {
			_setVolume?: (gain: number) => void
		}

		try {
			audioTrack._setVolume?.(gain)
		} catch (error) {
			console.warn("[audio] failed to set track volume", error)
		}
	},
})

adapter.registerSoundpad(nativeSoundpad)

// important register the getter hook
adapter.registerSessionDataGetter(async () => ({
	user_id: session.user?._id,
	token: session.token,
}))

// register all rtc global objects
registerRtcGlobals()
// keep the audio device list and routing in sync with hardware hotplug
audioManager.observe()
// syncronize audio process
audioProcessing.sync()

initRtcEvents()
