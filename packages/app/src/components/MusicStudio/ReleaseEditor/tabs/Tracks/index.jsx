import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { DragDropContext, Droppable } from "react-beautiful-dnd"
import jsmediatags from "jsmediatags/dist/jsmediatags.min.js"

import { Icons } from "@components/Icons"

import TrackListItem from "./components/TrackListItem"
import UploadHint from "./components/UploadHint"

import "./index.less"

async function uploadBinaryArrayToStorage(bin, args) {
    const { format, data } = bin

    const filenameExt = format.split("/")[1]
    const filename = `cover.${filenameExt}`

    const byteArray = new Uint8Array(data)
    const blob = new Blob([byteArray], { type: data.type })

    // create a file object
    const file = new File([blob], filename, {
        type: format,
    })

    return await app.cores.remoteStorage.uploadFile(file, args)
}

class TrackManifest {
    constructor(params) {
        this.params = params

        if (params.uid) {
            this.uid = params.uid
        }

        if (params.cover) {
            this.cover = params.cover
        }

        if (params.title) {
            this.title = params.title
        }

        if (params.album) {
            this.album = params.album
        }

        if (params.artist) {
            this.artist = params.artist
        }

        if (params.source) {
            this.source = params.source
        }

        return this
    }

    uid = null

    cover = "https://storage.ragestudio.net/comty-static-assets/default_song.png"

    title = "Untitled"

    album = "Unknown"

    artist = "Unknown"

    source = null

    async initialize() {
        const metadata = await this.analyzeMetadata(this.params.file.originFileObj)

        console.log(metadata)

        if (metadata.tags) {
            if (metadata.tags.title) {
                this.title = metadata.tags.title
            }

            if (metadata.tags.artist) {
                this.artist = metadata.tags.artist
            }

            if (metadata.tags.album) {
                this.album = metadata.tags.album
            }

            if (metadata.tags.picture) {
                const coverUpload = await uploadBinaryArrayToStorage(metadata.tags.picture)

                this.cover = coverUpload.url
            }
        }

        return this
    }

    analyzeMetadata = async (file) => {
        return new Promise((resolve, reject) => {
            jsmediatags.read(file, {
                onSuccess: (data) => {
                    return resolve(data)
                },
                onError: (error) => {
                    return reject(error)
                }
            })
        })
    }
}

class TracksManager extends React.Component {
    state = {
        list: [],
        pendingUploads: [],
    }

    componentDidMount() {
        if (typeof this.props.list !== "undefined" && Array.isArray(this.props.list)) {
            this.setState({
                list: this.props.list
            })
        }
    }

    componentDidUpdate = (prevProps, prevState) => {
        if (prevState.list !== this.state.list || prevState.pendingUploads !== this.state.pendingUploads) {
            if (typeof this.props.onChangeState === "function") {
                this.props.onChangeState(this.state)
            }
        }
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

        this.setState({
            list: this.state.list.filter((item) => item.uid !== uid),
        })
    }

    modifyTrackByUid = (uid, track) => {
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

        if (!this.state.pendingUploads.includes(uid)) {
            this.setState({
                pendingUploads: [...this.state.pendingUploads, uid],
            })
        }
    }

    removeTrackUIDFromPendingUploads = (uid) => {
        if (!uid) {
            return false
        }

        this.setState({
            pendingUploads: this.state.pendingUploads.filter((item) => item !== uid),
        })
    }

    handleUploaderStateChange = async (change) => {
        const uid = change.file.uid

        switch (change.file.status) {
            case "uploading": {
                this.addTrackUIDToPendingUploads(uid)

                const trackManifest = new TrackManifest({
                    uid: uid,
                    file: change.file,
                })

                this.addTrackToList(trackManifest)

                const trackData = await trackManifest.initialize()

                this.modifyTrackByUid(uid, trackData)

                break
            }
            case "done": {
                // remove pending file
                this.removeTrackUIDFromPendingUploads(uid)

                const trackIndex = this.state.list.findIndex((item) => item.uid === uid)

                if (trackIndex === -1) {
                    console.error(`Track with uid [${uid}] not found!`)
                    break
                }

                // update track list
                await this.modifyTrackByUid(uid, {
                    source: change.file.response.url
                })

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
        const response = await app.cores.remoteStorage.uploadFile(req.file, {
            onProgress: this.handleTrackFileUploadProgress,
            service: "b2"
        }).catch((error) => {
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
        console.log(file, progress)
    }

    orderTrackList = (result) => {
        if (!result.destination) {
            return
        }

        this.setState((prev) => {
            const trackList = [...prev.list]

            const [removed] = trackList.splice(result.source.index, 1)

            trackList.splice(result.destination.index, 0, removed)

            return {
                list: trackList
            }
        })
    }

    render() {
        console.log(`Tracks List >`, this.state.list)
        return <div className="music-studio-release-editor-tracks">
            <antd.Upload
                className="music-studio-tracks-uploader"
                onChange={this.handleUploaderStateChange}
                customRequest={this.uploadToStorage}
                showUploadList={false}
                accept="audio/*"
                multiple
            >
                {
                    this.state.list.length === 0 ?
                        <UploadHint /> : <antd.Button
                            className="uploadMoreButton"
                            icon={<Icons.Plus />}
                        >
                            Add another
                        </antd.Button>
                }
            </antd.Upload>

            <DragDropContext
                onDragEnd={this.orderTrackList}
            >
                <Droppable
                    droppableId="droppable"
                >
                    {(provided, snapshot) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="music-studio-release-editor-tracks-list"
                        >
                            {
                                this.state.list.length === 0 && <antd.Result
                                    status="info"
                                    title="No tracks"
                                />
                            }
                            {
                                this.state.list.map((track, index) => {
                                    return <TrackListItem
                                        index={index}
                                        track={track}
                                    />
                                })
                            }
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    }
}

const ReleaseTracks = (props) => {
    const { state, setState } = props

    return <div className="music-studio-release-editor-tab">
        <h1>Tracks</h1>

        <TracksManager
            _id={state._id}
            list={state.list}
            onChangeState={(managerState) => {
                setState({
                    ...state,
                    ...managerState
                })
            }}
        />
    </div>
}

export default ReleaseTracks