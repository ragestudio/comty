import { Howl } from "howler"

const ignoreIncomingCallTimeout = 45000 // 45 seconds

function ignoreOutgoingCall(core) {
	// stop the audio
	if (core._outgoingCallAudio) {
		core._outgoingCallAudio.stop()
		core._outgoingCallAudio = null
	}

	// remove the timeout
	core._outgoingCallIgnoreTimeout = null

	// clear incoming call state
	core.state.outGoingCall = null

	// leave the channel
}

export default async function (userId, { alternativeSfx = false } = {}) {
	if (typeof userId !== "string") {
		throw new Error("userId must be a string")
	}

	const callInfo = await this.socket.call("call:dispatch", {
		userId,
		alternativeSfx: alternativeSfx,
	})

	console.log(callInfo)

	const outgoingCallAudioSrc =
		app.cores.sfx.soundsPool()["call_outgoing"]?._src

	if (outgoingCallAudioSrc && !this._outgoingCallAudio) {
		const url = new URL(outgoingCallAudioSrc, window.location.origin)

		this._outgoingCallAudio = new Howl({
			src: url.href,
			loop: true,
			volume: 0.5,
		})
		this._outgoingCallAudio.play()
	}

	// start the timeout
	this._outgoingCallIgnoreTimeout = setTimeout(() => {
		ignoreOutgoingCall(this)
	}, ignoreIncomingCallTimeout)
}
