import React from "react"
import * as antd from "antd"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import classnames from "classnames"

import { Icons } from "@components/Icons"
import TrackEditor from "../TrackEditor"

import "./index.less"

const stateToString = {
	uploading: "Uploading",
	transmuxing: "Processing...",
	uploading_s3: "Archiving...",
}

const getTitleString = ({ track, progress }) => {
	if (progress) {
		return stateToString[progress.state] || progress.state
	}
	return track.title
}

const SortableTrackItem = ({
	id,
	release,
	track,
	index,
	progress,
	disabled,
	onUpdate,
	onDelete,
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id,
		disabled,
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.8 : 1,
		zIndex: isDragging ? 1000 : 1,
	}

	const handleEditTrack = React.useCallback(() => {
		app.layout.drawer.open("track-editor", TrackEditor, {
			props: {
				release: release,
				track: track,
				onUpdate: (updatedTrack) => onUpdate(track.uid, updatedTrack),
			},
		})
	}, [track, onUpdate])

	const handleRemoveTrack = React.useCallback(() => {
		onDelete?.(track.uid)
	}, [onDelete, track.uid])

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={classnames(
				"music-studio-release-editor-tracks-list-item",
				{
					["disabled"]: disabled,
					["dragging"]: isDragging,
				},
			)}
		>
			<div
				className="music-studio-release-editor-tracks-list-item-progress"
				style={{
					"--upload-progress": `${progress?.percent ?? 0}%`,
				}}
			/>

			{/* <div className="music-studio-release-editor-tracks-list-item-index">
				<span>{index + 1}</span>
			</div> */}

			{progress !== null && <Icons.LoadingOutlined />}

			<img
				src={track.cover}
				className="music-studio-release-editor-tracks-list-item-cover"
			/>

			<div className="music-studio-release-editor-tracks-list-item-info">
				<span>{getTitleString({ track, progress })}</span>
				{!progress && (
					<>
						<span id="artist">{track.artist}</span>
						<span id="album">{track.album}</span>
					</>
				)}
			</div>

			<div className="music-studio-release-editor-tracks-list-item-actions">
				<antd.Popconfirm
					title="Are you sure you want to delete this track?"
					onConfirm={handleRemoveTrack}
					okText="Yes"
					disabled={disabled}
				>
					<antd.Button
						type="ghost"
						icon={<Icons.FiTrash2 />}
						disabled={disabled}
					/>
				</antd.Popconfirm>

				<antd.Button
					type="ghost"
					icon={<Icons.FiEdit2 />}
					onClick={handleEditTrack}
					disabled={disabled}
				/>

				<div
					{...attributes}
					{...listeners}
					className="music-studio-release-editor-tracks-list-item-dragger"
					title="Drag to reorder track"
					role="button"
					tabIndex={disabled ? -1 : 0}
					aria-label="Drag to reorder track"
				>
					<Icons.MdDragIndicator />
				</div>
			</div>
		</div>
	)
}

export default SortableTrackItem
