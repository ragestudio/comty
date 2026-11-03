import type { RTCEventMap } from "@comty/spaces-sdk/rtc"

import { rtcService } from "@comty/spaces-sdk/rtc"
import { play as sfxPlay } from "@/engine/sfx"

const VIDEO_MEDIA_TAGS = ["user-cam", "screen-video"]

export const RTC_EVENTS = {
	"rtc:channel:joined": () => {
		sfxPlay("rtc:channel:join")
	},
	"rtc:channel:left": () => {
		sfxPlay("rtc:channel:leave")
	},
	"rtc:mute": () => {
		sfxPlay("rtc:mute")
	},
	"rtc:unmute": () => {
		sfxPlay("rtc:unmute")
	},
	"rtc:deafen": () => {
		sfxPlay("rtc:deafen")
	},
	"rtc:undeafen": () => {
		sfxPlay("rtc:undeafen")
	},
	"rtc:client:joined": () => {
		sfxPlay("rtc:channel:join")
	},
	"rtc:client:left": () => {
		sfxPlay("rtc:channel:leave")
	},
	"rtc:producer:joined": (producer) => {
		const mediaTag = producer.appData?.mediaTag

		if (mediaTag && VIDEO_MEDIA_TAGS.includes(mediaTag)) {
			sfxPlay("rtc:channel:video:join")
		}
	},
	"rtc:producer:left": (producer) => {
		const mediaTag = producer.appData?.mediaTag

		if (mediaTag && VIDEO_MEDIA_TAGS.includes(mediaTag)) {
			sfxPlay("rtc:channel:video:leave")
		}
	},
} satisfies Partial<RTCEventMap>

export function initRtcEvents() {
	for (const [event, handler] of Object.entries(RTC_EVENTS)) {
		rtcService.eventBus.on(event, handler)
	}
}

export function deinitRtcEvents() {
	for (const [event, handler] of Object.entries(RTC_EVENTS)) {
		rtcService.eventBus.off(event, handler)
	}
}
