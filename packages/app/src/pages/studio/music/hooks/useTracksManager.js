import React from "react"
import queuedUploadFile from "@utils/queuedUploadFile"
import FilesModel from "@models/files"
import TrackManifest from "@cores/player/classes/TrackManifest"

const useTracksManager = (initialTracks = [], updater) => {
	const [tracks, setTracks] = React.useState(initialTracks)
	const [pendingUploads, setPendingUploads] = React.useState([])

	const findTrackByUid = React.useCallback(
		(uid) => {
			return tracks.find((track) => track.uid === uid)
		},
		[tracks],
	)

	const addTrack = React.useCallback((track) => {
		if (!track) {
			return false
		}

		setTracks((prev) => [...prev, track])
	}, [])

	const removeTrack = React.useCallback((uid) => {
		if (!uid) {
			return false
		}

		setTracks((prev) => {
			const filtered = prev.filter((track) => track.uid !== uid)
			return filtered.length !== prev.length ? filtered : prev
		})
		setPendingUploads((prev) => prev.filter((upload) => upload.uid !== uid))
	}, [])

	const updateTrack = React.useCallback((uid, updates) => {
		if (!uid || !updates) {
			return false
		}

		setTracks((prev) => {
			const updated = prev.map((track) =>
				track.uid === uid ? { ...track, ...updates } : track,
			)
			return JSON.stringify(updated) !== JSON.stringify(prev)
				? updated
				: prev
		})
	}, [])

	const reorderTracks = React.useCallback((newTracksArray) => {
		if (!Array.isArray(newTracksArray)) {
			console.warn("reorderTracks: Invalid tracks array provided")
			return
		}

		setTracks((prev) => {
			if (JSON.stringify(prev) === JSON.stringify(newTracksArray)) {
				return prev
			}
			return newTracksArray
		})
	}, [])

	const addPendingUpload = React.useCallback((uid) => {
		if (!uid) {
			return false
		}

		setPendingUploads((prev) => {
			if (prev.find((upload) => upload.uid === uid)) return prev
			return [...prev, { uid, progress: 0 }]
		})
	}, [])

	const removePendingUpload = React.useCallback((uid) => {
		if (!uid) {
			return false
		}

		setPendingUploads((prev) => prev.filter((upload) => upload.uid !== uid))
	}, [])

	const updateUploadProgress = React.useCallback((uid, progress) => {
		setPendingUploads((prev) =>
			prev.map((upload) =>
				upload.uid === uid ? { ...upload, progress } : upload,
			),
		)
	}, [])

	const getUploadProgress = React.useCallback(
		(uid) => {
			const upload = pendingUploads.find((upload) => upload.uid === uid)
			return upload?.progress || null
		},
		[pendingUploads],
	)

	const uploadToStorage = React.useCallback(
		async (req) => {
			await queuedUploadFile(req.file, {
				onFinish: (file, response) => {
					req.onSuccess(response)
				},
				onError: req.onError,
				onProgress: (file, progress) => {
					updateUploadProgress(file.uid, progress)
				},
				headers: {
					transformations: "a-dash",
				},
			})
		},
		[updateUploadProgress],
	)

	const handleUploadStateChange = async (change) => {
		const uid = change.file.uid

		switch (change.file.status) {
			case "uploading": {
				addPendingUpload(uid)

				const trackManifest = new TrackManifest({
					uid,
					file: change.file.originFileObj,
				})

				addTrack(trackManifest)
				break
			}
			case "done": {
				let trackManifest = findTrackByUid(uid)

				if (!trackManifest) {
					console.error(`Track with uid [${uid}] not found!`)
					app.message.error(`Track with uid [${uid}] not found!`)
					break
				}

				trackManifest.source = change.file.response.url
				trackManifest = await trackManifest.initialize()

				try {
					if (trackManifest._coverBlob) {
						const coverFile = new File(
							[trackManifest._coverBlob],
							"cover",
							{ type: trackManifest._coverBlob.type },
						)

						const coverUpload = await FilesModel.upload(coverFile, {
							headers: {
								"prefer-no-job": true,
							},
						})

						trackManifest.cover = coverUpload.url
					}
				} catch (e) {
					console.error(e)
				}

				updateTrack(uid, trackManifest)
				removePendingUpload(uid)
				break
			}
			case "error":
			case "removed": {
				removePendingUpload(uid)
				removeTrack(uid)
				break
			}
			default:
				break
		}
	}

	// Sync with initial tracks from props (only when length changes or first mount)
	const prevInitialTracksLength = React.useRef(initialTracks.length)

	React.useEffect(() => {
		if (
			initialTracks.length !== prevInitialTracksLength.current ||
			tracks.length === 0
		) {
			setTracks(initialTracks)
			prevInitialTracksLength.current = initialTracks.length
		}
	}, [initialTracks.length])

	// Notify parent when tracks change (but not on initial mount)
	const isInitialMount = React.useRef(true)
	const onTracksChangeRef = React.useRef(updater)

	onTracksChangeRef.current = updater

	React.useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false
			return
		}

		onTracksChangeRef.current?.(tracks)
	}, [tracks])

	return {
		tracks,
		pendingUploads,
		addTrack,
		removeTrack,
		updateTrack,
		reorderTracks,
		getUploadProgress,
		uploadToStorage,
		handleUploadStateChange,
	}
}

export default useTracksManager
