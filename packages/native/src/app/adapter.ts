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
registerRtcGlobals()

import session from "@comty/api-lib/session"

import { app } from "@/engine/app"
import { adapter } from "@comty/spaces-sdk"
import { audioManager, audioProcessing } from "@comty/spaces-sdk/rtc/audio"
import nativeAudioProcessing from "@/engine/audioProcessing"

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

// keep the audio device list and routing in sync with hardware hotplug
audioManager.observe()

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

// important register the getter hook
adapter.registerSessionDataGetter(async () => ({
	user_id: app.userData?._id,
	token: session.token,
}))

audioProcessing.sync()
