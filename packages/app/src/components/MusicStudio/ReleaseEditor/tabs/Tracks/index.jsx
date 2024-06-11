import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

import { Icons } from "@components/Icons"
import TrackEditor from "@components/MusicStudio/TrackEditor"

import "./index.less"

const UploadHint = (props) => {
    return <div className="uploadHint">
        <Icons.MdPlaylistAdd />
        <p>Upload your tracks</p>
        <p>Drag and drop your tracks here or click this box to start uploading files.</p>
    </div>
}

const TrackListItem = (props) => {
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState(null)

    const { track } = props

    async function onClickEditTrack() {
        app.layout.drawer.open("track_editor", TrackEditor, {
            type: "drawer",
            props: {
                width: "600px",
                headerStyle: {
                    display: "none",
                }
            },
            componentProps: {
                track,
                onSave: (newTrackData) => {
                    console.log("Saving track", newTrackData)
                },
            },
        })
    }

    return <Draggable
        key={track._id}
        draggableId={track._id}
        index={props.index}
    >
        {
            (provided, snapshot) => {
                return <div
                    className={classnames(
                        "music-studio-release-editor-tracks-list-item",
                        {
                            ["loading"]: loading,
                            ["failed"]: !!error
                        }
                    )}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                >
                    <div className="music-studio-release-editor-tracks-list-item-index">
                        <span>{props.index + 1}</span>
                    </div>

                    <span>{track.title}</span>

                    <div className="music-studio-release-editor-tracks-list-item-actions">
                        <antd.Button
                            type="ghost"
                            icon={<Icons.Edit2 />}
                            onClick={onClickEditTrack}
                        />

                        <div
                            {...provided.dragHandleProps}
                            className="music-studio-release-editor-tracks-list-item-dragger"
                        >
                            <Icons.MdDragIndicator />
                        </div>
                    </div>
                </div>
            }
        }
    </Draggable>
}
 
const ReleaseTracks = (props) => {
    const { release } = props

    const [list, setList] = React.useState(release.list ?? [])
    const [pendingTracksUpload, setPendingTracksUpload] = React.useState([])

    async function onTrackUploaderChange (change) {
        switch (change.file.status) {
            case "uploading": {
                if (!pendingTracksUpload.includes(change.file.uid)) {
                    pendingTracksUpload.push(change.file.uid)
                }

                setList((prev) => {
                    return [
                        ...prev,
                        
                    ]
                })

                break
            }
            case "done": {
                // remove pending file
                this.setState({
                    pendingTracksUpload: this.state.pendingTracksUpload.filter((uid) => uid !== change.file.uid)
                })

                // update file url in the track info
                const track = this.state.trackList.find((file) => file.uid === change.file.uid)

                if (track) {
                    track.source = change.file.response.url
                    track.status = "done"
                }

                this.setState({
                    trackList: this.state.trackList
                })

                break
            }
            case "error": {
                // remove pending file
                this.handleTrackRemove(change.file.uid)

                // open a dialog to show the error and ask user to retry
                antd.Modal.error({
                    title: "Upload failed",
                    content: "An error occurred while uploading the file. You want to retry?",
                    cancelText: "No",
                    okText: "Retry",
                    onOk: () => {
                        this.handleUploadTrack(change)
                    },
                    onCancel: () => {
                        this.handleTrackRemove(change.file.uid)
                    }
                })
            }
            case "removed": {
                this.handleTrackRemove(change.file.uid)
            }

            default: {
                break
            }
        }
    }

    async function handleUploadTrack (req)  {
        const response = await app.cores.remoteStorage.uploadFile(req.file, {
            onProgress: this.handleFileProgress,
            service: "premium-cdn"
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

    async function onTrackDragEnd(result) {
        console.log(result)

        if (!result.destination) {
            return
        }

        setList((prev) => {
            const trackList = [...prev]

            const [removed] = trackList.splice(result.source.index, 1)

            trackList.splice(result.destination.index, 0, removed)

            return trackList
        })
    }

    return <div className="music-studio-release-editor-tab">
        <h1>Tracks</h1>

        <div>
            <antd.Upload
                className="uploader"
                customRequest={handleUploadTrack}
                onChange={onTrackUploaderChange}
                showUploadList={false}
                accept="audio/*"
                multiple
            >
                {
                    list.length === 0 ?
                        <UploadHint /> : <antd.Button
                            className="uploadMoreButton"
                            icon={<Icons.Plus />}
                        />
                }
            </antd.Upload>

            <DragDropContext
                onDragEnd={onTrackDragEnd}
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
                                list.length === 0 && <antd.Result
                                    status="info"
                                    title="No tracks"
                                />
                            }
                            {
                                list.map((track, index) => {
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
    </div>
}

export default ReleaseTracks