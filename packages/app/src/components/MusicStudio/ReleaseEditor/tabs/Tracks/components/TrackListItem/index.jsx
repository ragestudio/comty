import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Draggable } from "react-beautiful-dnd"

import Image from "@components/Image"
import { Icons } from "@components/Icons"
import TrackEditor from "@components/MusicStudio/TrackEditor"

import { ReleaseEditorStateContext } from "@contexts/MusicReleaseEditor"

import "./index.less"

const TrackListItem = (props) => {
	const context = React.useContext(ReleaseEditorStateContext)

	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState(null)

	const { track } = props

	async function onClickEditTrack() {
		context.renderCustomPage({
			header: "Track Editor",
			content: <TrackEditor />,
			props: {
				track: track,
			},
		})
	}

	async function onClickRemoveTrack() {
		props.onDelete(track.uid)
	}

	console.log("render")

	return (
		<div
			className={classnames(
				"music-studio-release-editor-tracks-list-item",
				{
					["loading"]: loading,
					["failed"]: !!error,
					["disabled"]: props.disabled,
				},
			)}
			data-swapy-item={track.id ?? track._id}
		>
			<div
				className="music-studio-release-editor-tracks-list-item-progress"
				style={{
					"--upload-progress": `${props.uploading.progress}%`,
				}}
			/>

			<div className="music-studio-release-editor-tracks-list-item-index">
				<span>{props.index + 1}</span>
			</div>

			{props.uploading.working && <Icons.LoadingOutlined />}

			<Image
				src={track.cover}
				height={25}
				width={25}
				style={{
					borderRadius: 8,
				}}
			/>

			<span>{track.title}</span>

			<div className="music-studio-release-editor-tracks-list-item-actions">
				<antd.Popconfirm
					title="Are you sure you want to delete this track?"
					onConfirm={onClickRemoveTrack}
					okText="Yes"
					disabled={props.disabled}
				>
					<antd.Button
						type="ghost"
						icon={<Icons.FiTrash2 />}
						disabled={props.disabled}
					/>
				</antd.Popconfirm>
				<antd.Button
					type="ghost"
					icon={<Icons.FiEdit2 />}
					onClick={onClickEditTrack}
					disabled={props.disabled}
				/>

				<div
					data-swapy-handle
					className="music-studio-release-editor-tracks-list-item-dragger"
				>
					<Icons.MdDragIndicator />
				</div>
			</div>
		</div>
	)
}

export default TrackListItem
