import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { DragDropContext, Droppable } from "react-beautiful-dnd"
import { createSwapy } from "swapy"

import TrackManifest from "@cores/player/classes/TrackManifest"

import { Icons } from "@components/Icons"

import TrackListItem from "./components/TrackListItem"
import UploadHint from "./components/UploadHint"

import "./index.less"

class TracksManager extends React.Component {
	swapyRef = React.createRef()

	state = {
		list: Array.isArray(this.props.list) ? this.props.list : [],
		pendingUploads: [],
	}

	componentDidUpdate = (prevProps, prevState) => {
		if (prevState.list !== this.state.list) {
			if (typeof this.props.onChangeState === "function") {
				this.props.onChangeState(this.state)
			}
		}
	}

	componentDidMount() {
		this.swapyRef.current = createSwapy(
			document.getElementById("editor-tracks-list"),
			{
				animation: "dynamic",
				dragAxis: "y",
			},
		)

		this.swapyRef.current.onSwapEnd((event) => {
			console.log("end", event)
			this.orderTrackList(
				event.slotItemMap.asArray.map((item) => item.item),
			)
		})
	}

	componentWillUnmount() {
		this.swapyRef.current.destroy()
	}

	findTrackByUid = (uid) => {
		if (!uid) {
			return false
		}

		return this.state.list.find((item) => item.uid === uid)
	}

	addTrackToList = (track) => {
		if (!track) {
			return false
		}

		this.setState({
			list: [...this.state.list, track],
		})
	}

	removeTrackByUid = (uid) => {
		if (!uid) {
			return false
		}

		this.removeTrackUIDFromPendingUploads(uid)

		this.setState({
			list: this.state.list.filter((item) => item.uid !== uid),
		})
	}

	modifyTrackByUid = (uid, track) => {
		console.log("modifyTrackByUid", uid, track)
		if (!uid || !track) {
			return false
		}

		this.setState({
			list: this.state.list.map((item) => {
				if (item.uid === uid) {
					return {
						...item,
						...track,
					}
				}

				return item
			}),
		})
	}

	addTrackUIDToPendingUploads = (uid) => {
		if (!uid) {
			return false
		}

		const pendingUpload = this.state.pendingUploads.find(
			(item) => item.uid === uid,
		)

		if (!pendingUpload) {
			this.setState({
				pendingUploads: [
					...this.state.pendingUploads,
					{
						uid: uid,
						progress: 0,
					},
				],
			})
		}
	}

	removeTrackUIDFromPendingUploads = (uid) => {
		if (!uid) {
			return false
		}

		this.setState({
			pendingUploads: this.state.pendingUploads.filter(
				(item) => item.uid !== uid,
			),
		})
	}

	getUploadProgress = (uid) => {
		const uploadProgressIndex = this.state.pendingUploads.findIndex(
			(item) => item.uid === uid,
		)

		if (uploadProgressIndex === -1) {
			return 0
		}

		return this.state.pendingUploads[uploadProgressIndex].progress
	}

	updateUploadProgress = (uid, progress) => {
		const uploadProgressIndex = this.state.pendingUploads.findIndex(
			(item) => item.uid === uid,
		)

		if (uploadProgressIndex === -1) {
			return false
		}

		const newData = [...this.state.pendingUploads]

		newData[uploadProgressIndex].progress = progress

		console.log(`Updating progress for [${uid}] to [${progress}]`)

		this.setState({
			pendingUploads: newData,
		})
	}

	handleUploaderStateChange = async (change) => {
		const uid = change.file.uid

		console.log("handleUploaderStateChange", change)

		switch (change.file.status) {
			case "uploading": {
				this.addTrackUIDToPendingUploads(uid)

				const trackManifest = new TrackManifest({
					uid: uid,
					file: change.file,
					onChange: this.modifyTrackByUid,
				})

				this.addTrackToList(trackManifest)

				break
			}
			case "done": {
				// remove pending file
				this.removeTrackUIDFromPendingUploads(uid)

				let trackManifest = this.state.list.find(
					(item) => item.uid === uid,
				)

				if (!trackManifest) {
					console.error(`Track with uid [${uid}] not found!`)
					break
				}

				// // update track list
				// await this.modifyTrackByUid(uid, {
				//     source: change.file.response.url
				// })

				trackManifest.source = change.file.response.url
				trackManifest = await trackManifest.initialize()

				await this.modifyTrackByUid(uid, trackManifest)

				break
			}
			case "error": {
				// remove pending file
				this.removeTrackUIDFromPendingUploads(uid)

				// remove from tracklist
				await this.removeTrackByUid(uid)
			}
			case "removed": {
				// stop upload & delete from pending list and tracklist
				await this.removeTrackByUid(uid)
			}
			default: {
				break
			}
		}
	}

	uploadToStorage = async (req) => {
		const response = await app.cores.remoteStorage
			.uploadFile(req.file, {
				onProgress: this.handleTrackFileUploadProgress,
				service: "b2",
				headers: {
					transmux: "a-dash",
				},
			})
			.catch((error) => {
				console.error(error)
				antd.message.error(error)

				req.onError(error)

				return false
			})

		if (response) {
			req.onSuccess(response)
		}
	}

	handleTrackFileUploadProgress = async (file, progress) => {
		this.updateUploadProgress(file.uid, progress)
	}

	orderTrackList = (orderedIdsArray) => {
		this.setState((prev) => {
			// move all list items by id
			const orderedIds = orderedIdsArray.map((id) =>
				this.state.list.find((item) => item._id === id),
			)
			console.log("orderedIds", orderedIds)
			return {
				list: orderedIds,
			}
		})
	}

	render() {
		console.log(`Tracks List >`, this.state.list)

		return (
			<div className="music-studio-release-editor-tracks">
				<antd.Upload
					className="music-studio-tracks-uploader"
					onChange={this.handleUploaderStateChange}
					customRequest={this.uploadToStorage}
					showUploadList={false}
					accept="audio/*"
					multiple
				>
					{this.state.list.length === 0 ? (
						<UploadHint />
					) : (
						<antd.Button
							className="uploadMoreButton"
							icon={<Icons.FiPlus />}
						>
							Add another
						</antd.Button>
					)}
				</antd.Upload>

				<div
					id="editor-tracks-list"
					className="music-studio-release-editor-tracks-list"
				>
					{this.state.list.length === 0 && (
						<antd.Result status="info" title="No tracks" />
					)}

					{this.state.list.map((track, index) => {
						const progress = this.getUploadProgress(track.uid)

						return (
							<div data-swapy-slot={track._id ?? track.uid}>
								<TrackListItem
									index={index}
									track={track}
									onEdit={this.modifyTrackByUid}
									onDelete={this.removeTrackByUid}
									uploading={{
										progress: progress,
										working: this.state.pendingUploads.find(
											(item) => item.uid === track.uid,
										),
									}}
									disabled={progress > 0}
								/>
							</div>
						)
					})}
				</div>
			</div>
		)
	}
}

const ReleaseTracks = (props) => {
	const { state, setState } = props

	return (
		<div className="music-studio-release-editor-tab">
			<h1>Tracks</h1>

			<TracksManager
				_id={state._id}
				list={state.list}
				onChangeState={(managerState) => {
					setState({
						...state,
						...managerState,
					})
				}}
			/>
		</div>
	)
}

export default ReleaseTracks
