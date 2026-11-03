import { AudioPlayer, createAudioPlayer } from "expo-audio"

function createSfxPlayer(assetId: number) {
	return createAudioPlayer(
		{ assetId },
		{
			downloadFirst: true,
		},
	)
}

export const sfx = {
	"rtc:channel:join": createSfxPlayer(
		require("@comty/shared/assets/sounds/media_channel_join.wav"),
	),
	"rtc:channel:leave": createSfxPlayer(
		require("@comty/shared/assets/sounds/media_channel_leave.wav"),
	),
	"rtc:channel:video:join": createSfxPlayer(
		require("@comty/shared/assets/sounds/media_video_join.wav"),
	),
	"rtc:channel:video:leave": createSfxPlayer(
		require("@comty/shared/assets/sounds/media_video_leave.wav"),
	),
	"rtc:mute": createSfxPlayer(
		require("@comty/shared/assets/sounds/mute.wav"),
	),
	"rtc:unmute": createSfxPlayer(
		require("@comty/shared/assets/sounds/unmute.wav"),
	),
	"rtc:deafen": createSfxPlayer(
		require("@comty/shared/assets/sounds/deafen.wav"),
	),
	"rtc:undeafen": createSfxPlayer(
		require("@comty/shared/assets/sounds/undeafen.wav"),
	),
} satisfies Record<string, AudioPlayer>

export function play(id: keyof typeof sfx) {
	const media = sfx[id]

	if (!media) {
		console.error(`SFX with id [${id}] not found`)
		return
	}

	media.seekTo(0)
	media.play()
}

export type SfxKey = keyof typeof sfx

export default sfx
