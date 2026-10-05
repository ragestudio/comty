import type { VoiceState } from "@comty/shared/types/rtc/voiceState"
import type { RTC } from ".."

export class Client {
	constructor(core: RTC, data: Pick<Client, "userId" | "voiceState">) {
		this.core = core

		this.userId = data.userId
		this.voiceState = data.voiceState
	}

	get self() {
		return this.userId === this.core.userId
	}

	core: RTC

	userId: string

	voiceState: VoiceState = {
		muted: false,
		deafen: false,
	}

	localState = {
		muted: false,
		volume: 1,
	}
}

export default Client
