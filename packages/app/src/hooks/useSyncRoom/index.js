import { useState, useRef, useCallback, useEffect } from "react"

export default () => {
	const [syncRoom, setSyncRoom] = useState(null)
	const syncSocket = useRef(null)

	const subscribeLyricsUpdates = useCallback(
		(callback) => {
			if (!syncSocket.current) {
				return null
			}

			syncSocket.current.on("sync:lyrics:receive", callback)

			return () => syncSocket.current.off("sync:lyrics:receive", callback)
		},
		[syncSocket.current],
	)

	const unsubscribeLyricsUpdates = useCallback(
		(callback) => {
			if (!syncSocket.current) {
				return null
			}

			syncSocket.current.off("sync:lyrics:receive", callback)
		},
		[syncSocket.current],
	)

	useEffect(() => {
		const roomId = new URLSearchParams(window.location.search).get("sync")

		if (roomId) {
			app.cores.player
				.sync()
				.join(roomId)
				.then(() => {
					setSyncRoom(roomId)
					syncSocket.current = app.cores.player.sync().socket
				})
		}

		return () => {
			if (syncSocket.current) {
				app.cores.player.sync().leave()

				setSyncRoom(null)
				syncSocket.current = null
			}
		}
	}, [])

	return {
		syncRoom,
		subscribeLyricsUpdates,
		unsubscribeLyricsUpdates,
		isInSyncMode: app.cores.player.inOnSyncMode(),
	}
}
