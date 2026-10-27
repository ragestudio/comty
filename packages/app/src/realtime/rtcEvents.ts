import { rtcService } from "@/rtc"

const VIDEO_MEDIA_TAGS = ["user-cam", "screen-video"]

let initialized = false

export function initRtcEvents() {
	if (initialized) return

	initialized = true

	const bus = rtcService.eventBus

	bus.on("rtc:channel:join_failed", (error: any) => {
		app.cores.notifications.new({
			type: "error",
			title: "Failed to join",
			description: error.message,
			duration: 5,
		})
	})

	bus.on("rtc:channel:joined", () => {
		app.cores.sfx.play("media_channel_join")
	})

	bus.on("rtc:channel:left", () => {
		app.cores.sfx.play("media_channel_leave")
	})

	bus.on("rtc:mute", () => app.cores.sfx.play("mute"))
	bus.on("rtc:unmute", () => app.cores.sfx.play("unmute"))

	bus.on("rtc:deafen", () => app.cores.sfx.play("deafen"))
	bus.on("rtc:undeafen", () => app.cores.sfx.play("undeafen"))

	bus.on("rtc:client:joined", () => {
		app.cores.sfx.play("media_channel_join")
	})

	bus.on("rtc:client:left", () => {
		app.cores.sfx.play("media_channel_leave")
	})

	bus.on("rtc:producer:joined", (producer) => {
		const mediaTag = producer.appData?.mediaTag

		if (mediaTag && VIDEO_MEDIA_TAGS.includes(mediaTag)) {
			app.cores.sfx.play("media_video_join")
		}
	})

	bus.on("rtc:producer:left", (producer) => {
		const mediaTag = producer.appData?.mediaTag

		if (mediaTag && VIDEO_MEDIA_TAGS.includes(mediaTag)) {
			app.cores.sfx.play("media_video_leave")
		}
	})
}

export default initRtcEvents
