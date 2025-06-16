import React from "react"
import MusicModel from "@models/music"
import TrackManifest from "@cores/player/classes/TrackManifest"

const DEFAULT_RELEASE_STATE = {
	title: "Untitled",
	type: "single",
	public: false,
	cover: "",
	items: [],
	description: "",
	explicit: false,
}

const useReleaseEditor = (releaseId) => {
	const [loading, setLoading] = React.useState(true)
	const [submitting, setSubmitting] = React.useState(false)
	const [loadError, setLoadError] = React.useState(null)
	const [submitError, setSubmitError] = React.useState(null)

	const [data, setData] = React.useState(DEFAULT_RELEASE_STATE)
	const [initialValues, setInitialValues] = React.useState(
		DEFAULT_RELEASE_STATE,
	)

	const fetchData = React.useCallback(async () => {
		if (releaseId === "new") {
			setLoading(false)
			return
		}

		try {
			setLoading(true)
			setLoadError(null)

			const data = await MusicModel.getReleaseData(releaseId)

			if (Array.isArray(data.items)) {
				data.items = data.items.map((item) => new TrackManifest(item))
			}

			setData(data)
			setInitialValues(data)
		} catch (error) {
			console.error("Failed to load release data:", error)
			setLoadError(error)
		} finally {
			setLoading(false)
		}
	}, [releaseId])

	const changeData = React.useCallback((updates) => {
		setData((prev) => {
			let newData

			if (typeof updates === "function") {
				newData = updates(prev)
			} else {
				newData = { ...prev, ...updates }
			}

			// Prevent unnecessary updates
			if (JSON.stringify(newData) === JSON.stringify(prev)) {
				return prev
			}

			return newData
		})
	}, [])

	const hasChanges = React.useMemo(() => {
		return JSON.stringify(data) !== JSON.stringify(initialValues)
	}, [data, initialValues])

	const releaseDataRef = React.useRef(data)
	const hasChangesRef = React.useRef(hasChanges)

	releaseDataRef.current = data
	hasChangesRef.current = hasChanges

	const submitRelease = React.useCallback(async () => {
		if (!hasChangesRef.current) {
			app.message.warning("No changes to save")
			return
		}

		try {
			setSubmitting(true)
			setSubmitError(null)

			const currentReleaseData = releaseDataRef.current

			// Submit tracks first if there are any
			let trackIds = []
			if (
				currentReleaseData.items &&
				currentReleaseData.items.length > 0
			) {
				const tracks = await MusicModel.putTrack({
					items: currentReleaseData.items,
				})
				trackIds = tracks.items.map((item) => item._id)
			}

			// Then submit release
			const releasePayload = {
				_id: currentReleaseData._id,
				title: currentReleaseData.title,
				description: currentReleaseData.description,
				public: currentReleaseData.public,
				cover: currentReleaseData.cover,
				explicit: currentReleaseData.explicit,
				type: currentReleaseData.type,
				items: trackIds,
			}

			const result = await MusicModel.putRelease(releasePayload)

			// Update initial values to prevent showing "unsaved changes"
			setInitialValues(currentReleaseData)

			app.message.success("Release saved successfully")

			if (releaseId === "new") {
				app.location.push(result._id)
			}

			// update items
			fetchData()

			return result
		} catch (error) {
			console.error("Failed to submit release:", error)
			app.message.error(error.message || "Failed to save release")
			setSubmitError(error)
			throw error
		} finally {
			setSubmitting(false)
		}
	}, [])

	const deleteRelease = React.useCallback(async () => {
		const currentReleaseData = releaseDataRef.current

		if (!currentReleaseData._id) {
			console.warn("Cannot delete release without ID")
			return
		}

		try {
			await MusicModel.deleteRelease(currentReleaseData._id)
			app.message.success("Release deleted successfully")
			app.location.push("/studio/music")
		} catch (error) {
			console.error("Failed to delete release:", error)
			app.message.error(error.message || "Failed to delete release")
		}
	}, [])

	React.useEffect(() => {
		fetchData()
	}, [fetchData])

	const isNewRelease = releaseId === "new"
	const canSubmit = hasChanges && !submitting && !loading

	return {
		// State
		loading,
		submitting,
		loadError,
		submitError,

		hasChanges,
		isNewRelease,
		canSubmit,

		data: data,
		changeData: changeData,

		// Actions
		submitRelease: submitRelease,
		deleteRelease: deleteRelease,
		reload: fetchData,
	}
}

export default useReleaseEditor
