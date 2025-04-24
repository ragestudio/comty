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
		items: Array.isArray(this.props.items) ? this.props.items : [],
		pendingUploads: [],
	}

	componentDidUpdate = (prevProps, prevState) => {
		if (prevState.items !== this.state.items) {
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

		return this.state.items.find((item) => item.uid === uid)
	}

	addTrackToList = (track) => {
		if (!track) {
			return false
		}

		this.setState({
			items: [...this.state.items, track],
		})
	}

	removeTrackByUid = (uid) => {
		if (!uid) {
			return false
		}

		this.removeTrackUIDFromPendingUploads(uid)

		this.setState({
			items: this.state.items.filter((item) => item.uid !== uid),
		})
	}

	modifyTrackByUid = (uid, track) => {
		if (!uid || !track) {
			return false
		}

		this.setState({
			items: this.state.items.map((item) => {
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
			return null
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

		console.log(`Updating progress for [${uid}] to >`, progress)

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
					file: change.file.originFileObj,
				})

				this.addTrackToList(trackManifest)

				break
			}
			case "done": {
				// remove pending file
				this.removeTrackUIDFromPendingUploads(uid)

				let trackManifest = this.state.items.find(
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

				// if has a cover, Upload
				if (trackManifest._coverBlob) {
					console.log(
						`[${trackManifest.uid}] Founded cover, uploading...`,
					)
					const coverFile = new File(
						[trackManifest._coverBlob],
						"cover.jpg",
						{ type: trackManifest._coverBlob.type },
					)

					const coverUpload =
						await app.cores.remoteStorage.uploadFile(coverFile)

					trackManifest.cover = coverUpload.url
				}

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
				headers: {
					transformations: "a-dash",
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
				this.state.items.find((item) => item._id === id),
			)
			console.log("orderedIds", orderedIds)
			return {
				items: orderedIds,
			}
		})
	}

	render() {
		console.log(`Tracks List >`, this.state.items)

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
					{this.state.items.length === 0 ? (
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
					{this.state.items.length === 0 && (
						<antd.Result status="info" title="No tracks" />
					)}

					{this.state.items.map((track, index) => {
						const progress = this.getUploadProgress(track.uid)

						return (
							<div data-swapy-slot={track._id ?? track.uid}>
								<TrackListItem
									index={index}
									track={track}
									onEdit={this.modifyTrackByUid}
									onDelete={this.removeTrackByUid}
									progress={progress}
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
				items={state.items}
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
