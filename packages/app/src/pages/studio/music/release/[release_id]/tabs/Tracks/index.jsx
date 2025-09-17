import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"
import useTracksManager from "../../../../hooks/useTracksManager"

import UploadHint from "./components/UploadHint"
import SortableTrackList from "./components/SortableTrackList"

import "./index.less"

const ReleaseTracks = ({ data, changeData }) => {
	const {
		tracks,
		getUploadProgress,
		uploadToStorage,
		handleUploadStateChange,
		removeTrack,
		updateTrack,
		reorderTracks,
	} = useTracksManager(data.items, (tracks) =>
		changeData({
			items: tracks,
		}),
	)

	// Handle reorder with new tracks array
	const handleReorder = React.useCallback(
		(newTracksArray) => {
			reorderTracks(newTracksArray)
		},
		[reorderTracks],
	)

	const renderUploadButton = () => {
		if (tracks.length === 0) {
			return <UploadHint />
		}

		return (
			<antd.Button
				className="uploadMoreButton"
				icon={<Icons.Plus />}
			>
				Add another
			</antd.Button>
		)
	}

	const renderTracksList = () => {
		if (tracks.length === 0) {
			return (
				<antd.Result
					status="info"
					title="No tracks"
				/>
			)
		}

		return (
			<SortableTrackList
				release={data}
				tracks={tracks}
				onReorder={handleReorder}
				getUploadProgress={getUploadProgress}
				onUpdate={updateTrack}
				onDelete={removeTrack}
			/>
		)
	}

	return (
		<div className="music-studio-release-editor-tab">
			<h1>Tracks</h1>

			<div className="music-studio-release-editor-tracks">
				<antd.Upload
					className="music-studio-tracks-uploader"
					onChange={handleUploadStateChange}
					customRequest={uploadToStorage}
					showUploadList={false}
					accept="audio/*"
					multiple
				>
					{renderUploadButton()}
				</antd.Upload>

				<div className="music-studio-release-editor-tracks-container">
					{renderTracksList()}
				</div>
			</div>
		</div>
	)
}

export default ReleaseTracks
