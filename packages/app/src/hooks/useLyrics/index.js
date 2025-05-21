import { useState, useCallback, useEffect } from "react"
import parseTimeToMs from "@utils/parseTimeToMs"

export default ({ trackManifest }) => {
	const [lyrics, setLyrics] = useState(null)

	const processLyrics = useCallback((rawLyrics) => {
		if (!rawLyrics) return false

		return rawLyrics.sync_audio_at && !rawLyrics.sync_audio_at_ms
			? {
					...rawLyrics,
					sync_audio_at_ms: parseTimeToMs(rawLyrics.sync_audio_at),
				}
			: rawLyrics
	}, [])

	const loadCurrentTrackLyrics = useCallback(async () => {
		let data = null

		const track = app.cores.player.track()

		if (!trackManifest || !track) {
			return null
		}

		// if is in sync mode, fetch lyrics from sync room
		if (app.cores.player.inOnSyncMode()) {
			const syncRoomSocket = app.cores.player.sync().socket

			if (syncRoomSocket) {
				data = await syncRoomSocket
					.call("sync_room:request_lyrics")
					.catch(() => null)
			}
		} else {
			data = await track.serviceOperations.fetchLyrics().catch(() => null)
		}

		// if no data founded, flush lyrics
		if (!data) {
			return setLyrics(null)
		}

		// process & set lyrics
		data = processLyrics(data)
		setLyrics(data)

		console.log("Track Lyrics:", data)
	}, [trackManifest, processLyrics])

	// Load lyrics when track manifest changes or when translation is toggled
	useEffect(() => {
		if (!trackManifest) {
			setLyrics(null)
			return
		}

		if (!lyrics || lyrics.track_id !== trackManifest._id) {
			loadCurrentTrackLyrics()
		}
	}, [trackManifest, lyrics?.track_id, loadCurrentTrackLyrics])

	return {
		lyrics,
		setLyrics,
		loadCurrentTrackLyrics,
	}
}
