export default class MediaSession {
	constructor(player) {
		this.player = player
	}

	async initialize() {
		for (const [action, handler] of this.handlers) {
			navigator.mediaSession.setActionHandler(action, handler)
		}
	}

	handlers = [
		[
			"play",
			() => {
				console.log("media session play event", "play")
				this.player.resumePlayback()
			},
		],
		[
			"pause",
			() => {
				console.log("media session pause event", "pause")
				this.player.pausePlayback()
			},
		],
		[
			"seekto",
			(seek) => {
				console.log("media session seek event", seek)
				this.player.seek(seek.seekTime)
			},
		],
	]

	update = (manifest) => {
		navigator.mediaSession.metadata = new MediaMetadata({
			title: manifest.title,
			artist: manifest.artist,
			album: manifest.album,
			artwork: [
				{
					src: manifest.cover,
				},
			],
		})
	}

	flush = () => {
		navigator.mediaSession.metadata = null
	}

	updateIsPlaying = (isPlaying) => {
		navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"
	}
}
