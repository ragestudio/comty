export default class SyncRoom {
	constructor(player) {
		this.player = player
	}

	static pushInterval = 1000
	static maxTimeOffset = parseFloat(0.15)

	state = {
		joined_room: null,
		last_track_id: null,
	}

	pushInterval = null

	socket = null

	start = async () => {
		if (!this.socket) {
			await this.createSocket()
		}

		await this.pushState()
		setInterval(this.pushState, SyncRoom.pushInterval)

		this.player.eventBus.on("player.state.update", this.pushState)

		this.socket.on(
			`sync_room:${app.userData._id}:request_lyrics`,
			async () => {
				let lyrics = null

				if (this.player.queue.currentItem) {
					lyrics =
						await this.player.queue.currentItem.manifest.serviceOperations.fetchLyrics(
							{
								preferTranslation: false,
							},
						)
				}

				this.socket.emit(
					`sync_room:${app.userData._id}:request_lyrics`,
					lyrics,
				)
			},
		)
	}

	stop = async () => {
		if (this.pushInterval) {
			clearInterval(this.pushInterval)
		}

		if (this.socket) {
			await this.socket.destroy()
		}
	}

	pushState = async () => {
		if (!this.socket) {
			return null
		}

		let track_manifest = null
		const currentItem = this.player.queue.currentItem

		if (currentItem) {
			track_manifest = {
				...currentItem.toSeriableObject(),
			}

			delete track_manifest.source
		}

		// check if has changed the track
		if (
			this.state.last_track_id &&
			this.state.last_track_id !== track_manifest?._id
		) {
			// try to get lyrics
			const lyrics = await currentItem.serviceOperations
				.fetchLyrics()
				.catch(() => null)

			this.socket.emit(`sync_room:push_lyrics`, lyrics)
		}

		this.state.last_track_id = track_manifest?._id

		await this.socket.emit(`sync_room:push`, {
			...this.player.state,
			track_manifest: track_manifest,
			duration: this.player.duration(),
			currentTime: this.player.seek(),
		})
	}

	syncState = async (data) => {
		if (!data || !data.track_manifest) {
			return false
		}

		// first check if manifest id is different
		if (
			!this.player.state.track_manifest ||
			data.track_manifest._id !== this.player.state.track_manifest._id
		) {
			if (data.track_manifest && data.track_manifest.mpd_string) {
				let mpd = new Blob([data.track_manifest.mpd_string], {
					type: "application/dash+xml",
				})

				data.track_manifest.source = URL.createObjectURL(mpd)
			}

			// start the player
			this.player.start(data.track_manifest)
		}

		// check if currentTime is more than maxTimeOffset
		const serverTime = data.currentTime ?? 0
		const currentTime = this.player.seek()
		const offset = serverTime - currentTime

		this.player.console.debug("sync_state", {
			serverPayload: data,
			serverTime: serverTime,
			currentTime: currentTime,
			offset: offset,
			maxTimeOffset: SyncRoom.maxTimeOffset,
		})

		if (
			typeof serverTime === "number" &&
			typeof currentTime === "number" &&
			Math.abs(offset) > SyncRoom.maxTimeOffset
		) {
			// seek to currentTime
			this.player.seek(serverTime)
		}

		// check if playback is paused
		if (
			!app.cores.player.base().audio.paused &&
			data.playback_status === "paused"
		) {
			this.player.pausePlayback()
		}

		if (
			app.cores.player.base().audio.paused &&
			data.playback_status === "playing"
		) {
			this.player.resumePlayback()
		}
	}

	join = async (user_id) => {
		if (!this.socket) {
			await this.createSocket()
		}

		this.socket.emit(`sync_room:join`, user_id)

		this.socket.on(`sync:receive`, this.syncState)

		this.state.joined_room = {
			user_id: user_id,
			members: [],
		}
	}

	leave = async () => {
		await this.socket.emit(`sync_room:leave`, this.state.joined_room)

		this.state.joined_room = null

		if (this.socket) {
			await this.socket.destroy()
		}
	}

	createSocket = async () => {
		this.socket = app.cores.api.socket()
	}
}
