import React from "react"
import * as antd from "antd"

import CoverEditor from "@components/CoverEditor"
import { Icons } from "@components/Icons"

import "./index.less"

const TrackField = ({ icon, label, children }) => (
	<div className="track-editor-field">
		<div className="track-editor-field-header">
			{icon}
			<span>{label}</span>
		</div>
		{children}
	</div>
)

const TrackEditor = ({
	release,
	track: initialTrack = {},
	onUpdate,
	close,
	setHeader,
}) => {
	const [track, setTrack] = React.useState(initialTrack)

	const handleSave = React.useCallback(async () => {
		onUpdate?.(track)
		close?.()
	}, [track, onUpdate, close])

	const handleChange = React.useCallback((key, value) => {
		setTrack((prev) => ({ ...prev, [key]: value }))
	}, [])

	const handleClickEditLyrics = React.useCallback(() => {
		app.layout.modal.confirm({
			headerText: "Save your changes",
			descriptionText:
				"All unsaved changes will be lost, make sure you have saved & submitted your changes before proceeding.",
			onConfirm: async () => {
				close()
				app.location.push(`/studio/music/track_lyrics/${track._id}`)
			},
		})
	}, [])

	const setParentCover = React.useCallback(() => {
		handleChange("cover", release.cover || "")
	}, [handleChange, release])

	const hasChanges = React.useMemo(() => {
		return JSON.stringify(initialTrack) !== JSON.stringify(track)
	}, [initialTrack, track])

	React.useEffect(() => {
		setHeader?.({
			title: "Track Editor",
			actions: [
				<antd.Button
					key="save"
					type="primary"
					onClick={handleSave}
					disabled={!hasChanges}
					icon={<Icons.Check />}
				>
					Save
				</antd.Button>,
			],
		})
	}, [setHeader, handleSave, hasChanges])

	console.log(track, release)

	return (
		<div className="track-editor">
			<TrackField
				icon={<Icons.Image />}
				label="Cover"
			>
				<CoverEditor
					value={track.cover}
					onChange={(url) => handleChange("cover", url)}
					extraActions={[
						<antd.Button
							key="parent-cover"
							onClick={setParentCover}
						>
							Use Parent
						</antd.Button>,
					]}
				/>
			</TrackField>

			<TrackField
				icon={<Icons.Music2 />}
				label="Title"
			>
				<antd.Input
					value={track.title}
					placeholder="Track title"
					onChange={(e) => handleChange("title", e.target.value)}
				/>
			</TrackField>

			<TrackField
				icon={<Icons.User />}
				label="Artist"
			>
				<antd.Input
					value={track.artist}
					placeholder="Artist"
					onChange={(e) => handleChange("artist", e.target.value)}
				/>
			</TrackField>

			<TrackField
				icon={<Icons.SquareLibrary />}
				label="Album"
			>
				<antd.Input
					value={track.album}
					placeholder="Album"
					onChange={(e) => handleChange("album", e.target.value)}
				/>
			</TrackField>

			<TrackField
				icon={<Icons.CircleAlert />}
				label="Explicit"
			>
				<antd.Switch
					checked={track.explicit}
					onChange={(value) => handleChange("explicit", value)}
				/>
			</TrackField>

			<TrackField
				icon={<Icons.Earth />}
				label="Public"
			>
				<antd.Switch
					value={track.public}
					onChange={(checked) => handleChange("public", checked)}
				/>
			</TrackField>

			<TrackField
				icon={<Icons.ClosedCaption />}
				label="Enhanced Lyrics"
			>
				<div className="track-editor-field-actions">
					<antd.Button
						disabled={!track.params?._id}
						onClick={handleClickEditLyrics}
					>
						Edit
					</antd.Button>

					{!track.params?._id && (
						<span>
							You cannot edit Video and Lyrics without releasing
							first
						</span>
					)}
				</div>
			</TrackField>
		</div>
	)
}

export default TrackEditor
