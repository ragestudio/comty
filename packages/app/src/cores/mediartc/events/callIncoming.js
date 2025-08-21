import NotificationUI from "../../notifications/ui"
import { Howl } from "howler"

import UserAvatar from "@components/UserAvatar"
import UserPreview from "@components/UserPreview"

const ignoreIncomingCallTimeout = 45000 // 45 seconds

const alternativesSfx = [
	"./sounds/pick_up_the_phone.ogg",
	"./sounds/new_ringtone.ogg",
]

function getAudioSfx(alternative) {
	if (alternative === false) {
		return app.cores.sfx.soundsPool()["call_incoming"]?._src
	}

	if (alternative === true) {
		alternative = 0
	}

	return alternativesSfx[alternative]
}

function ignoreIncomingCall(core) {
	// stop the audio
	if (core._incomingCallAudio) {
		core._incomingCallAudio.stop()
		core._incomingCallAudio = null
	}

	// close the notification
	if (core._incomingCallNotification) {
		NotificationUI.close(core._incomingCallNotification.key)
		core._incomingCallNotification = null
	}

	// remove the timeout
	core._incomingCallIgnoreTimeout = null

	// clear incoming call state
	core.state.incomingCall = null
}

export default async (core, payload) => {
	core.console.log("incoming call", payload)

	// set incoming call state
	core.state.incomingCall = payload

	const incomingCallAudioSrc = getAudioSfx(payload.alternativeSfx)

	// if there is an audio src, play it
	if (incomingCallAudioSrc && !core._incomingCallAudio) {
		core._incomingCallAudio = new Howl({
			src: incomingCallAudioSrc,
			loop: true,
			volume: 0.5,
		})
		core._incomingCallAudio.play()
	}

	// show notification ui
	core._incomingCallNotification = await NotificationUI.notify({
		title: "Incoming call",
		icon: React.createElement(UserAvatar, {
			user_id: payload.userId,
		}),
		message: `${payload.userId} is calling you`,
		duration: ignoreIncomingCallTimeout / 1000,
		actions: [
			{
				label: "Accept",
			},
			{
				label: "Reject",
			},
		],
		onClose: () => {
			ignoreIncomingCall(core)
		},
	})

	console.log(core._incomingCallNotification)

	// start the timeout
	core._incomingCallIgnoreTimeout = setTimeout(() => {
		ignoreIncomingCall(core)
	}, ignoreIncomingCallTimeout)
}
