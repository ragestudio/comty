import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

import UploadButton from "components/UploadButton"
import { Icons } from "components/Icons"

import PlaylistModel from "models/playlists"
import FilesModel from "models/files"

import "./index.less"

const UploadHint = (props) => {
    return <div className="uploadHint">
        <Icons.MdPlaylistAdd />
        <p>Upload your tracks</p>
        <p>Drag and drop your tracks here or click this box to start uploading files.</p>
    </div>
}

const FileListItem = React.memo((props) => {
    const isUploading = props.track.status === "uploading"

    return <Draggable key={props.track.uid} draggableId={props.track.uid} index={props.index}>
        {(provided, snapshot) => {
            return <div
                className={classnames(
                    "fileListItem",
                    {
                        ["uploading"]: isUploading,
                    }
                )}
                ref={provided.innerRef}
                {...provided.draggableProps}
            >

                {
                    isUploading &&
                    <Icons.LoadingOutlined
                        spin
                        className="fileListItem_loadingIcon"
                    />
                }

                <div className="fileListItem_cover">
                    <div className="fileListItem_cover_mask">
                        <Icons.MdEdit />
                    </div>

                    <img
                        src={props.track?.thumbnail}
                        alt="Track cover"
                        onClick={() => {
                            if (typeof props.onClickChangeCover === "function") {
                                if (!isUploading) {
                                    props.onClickChangeCover(props.track.uid)
                                }
                            }
                        }}
                    />
                </div>

                <div className="fileListItem_details">
                    <div className="fileListItem_title">
                        <div className="fileListItem_title_label">
                            <Icons.MdTitle />
                            <h4>Track name</h4>
                        </div>

                        <antd.Input
                            size="large"
                            bordered={false}
                            value={props.track?.title ?? "Track name"}
                            onChange={props.onTitleChange}
                            placeholder="Example: My track"
                        />
                    </div>

                    <div className="fileListItem_actions">
                        <antd.Popconfirm
                            title="Delete this track?"
                            description="Are you sure to delete this track?"
                            onConfirm={props.onClickRemove}
                            okText="Yes"
                            cancelText="No"
                        >
                            <antd.Button
                                type="primary"
                                icon={<Icons.MdDelete />}
                                danger
                            />
                        </antd.Popconfirm>
                    </div>
                </div>

                <div
                    {...provided.dragHandleProps}
                    className="fileListItem_dragHandle"
                >
                    <Icons.MdDragIndicator />
                </div>
            </div>
        }
        }
    </Draggable>
})

// TODO: Make cover preview style more beautiful (E.G. Use the entire div as background)
// TODO: Make files list item can be dragged to change their order

export default class PlaylistCreator extends React.Component {
    state = {
        playlistName: null,
        playlistDescription: null,
        playlistThumbnail: null,

        fileList: [],
        trackList: [],

        pendingUploads: [],
        loading: false,
    }

    onDragEnd = (result) => {
        if (!result.destination) {
            return
        }

        const trackList = this.state.trackList

        const [removed] = trackList.splice(result.source.index, 1);
        trackList.splice(result.destination.index, 0, removed);

        this.setState({
            trackList,
        })
    }

    handleTitleOnChange = (event) => {
        this.setState({
            playlistName: event.target.value
        })
    }

    handleDescriptionOnChange = (event) => {
        this.setState({
            playlistDescription: event.target.value
        })
    }

    handleTrackTitleOnChange = (event, uid) => {
        // find the file in the trackinfo
        const file = this.state.trackList.find((file) => file.uid === uid)

        if (file) {
            file.title = event.target.value
        }

        this.setState({
            trackList: this.state.trackList
        })
    }

    handleTrackCoverChange = (uid) => {
        // open a file dialog
        const fileInput = document.createElement("input")

        fileInput.type = "file"
        fileInput.accept = "image/*"

        fileInput.onchange = (event) => {
            const file = event.target.files[0]

            if (file) {
                // upload the file
                FilesModel.uploadFile(file).then((response) => {
                    // update the file url in the track info
                    const file = this.state.trackList.find((file) => file.uid === uid)

                    if (file) {
                        file.thumbnail = response.url
                    }

                    this.setState({
                        trackList: this.state.trackList
                    })
                })
            }
        }

        fileInput.click()
    }

    removeTrack = (uid) => {
        this.setState({
            fileList: this.state.fileList.filter((file) => file.uid !== uid),
            trackList: this.state.trackList.filter((file) => file.uid !== uid),
            pendingUploads: this.state.pendingUploads.filter((file_uid) => file_uid !== uid)
        })
    }

    handleUploaderOnChange = (change) => {
        console.log(change)

        switch (change.file.status) {
            case "uploading": {
                const { pendingUploads } = this.state

                if (!pendingUploads.includes(change.file.uid)) {
                    pendingUploads.push(change.file.uid)
                }

                this.setState({
                    pendingUploads: pendingUploads,
                    fileList: [...this.state.fileList, change.file],
                    trackList: [...this.state.trackList, {
                        uid: change.file.uid,
                        title: change.file.name,
                        source: null,
                        status: "uploading",
                        thumbnail: "https://storage.ragestudio.net/comty-static-assets/default_song.png"
                    }]
                })

                break
            }
            case "done": {
                // remove pending file
                this.setState({
                    pendingUploads: this.state.pendingUploads.filter(uid => uid !== change.file.uid)
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
                this.removeTrack(change.file.uid)

                // open a dialog to show the error and ask user to retry
                antd.Modal.error({
                    title: "Upload failed",
                    content: "An error occurred while uploading the file. You want to retry?",
                    cancelText: "No",
                    okText: "Retry",
                    onOk: () => {
                        this.handleUpload(change)
                    },
                    onCancel: () => {
                        this.removeTrack(change.file.uid)
                    }
                })
            }
            case "removed": {
                this.removeTrack(change.file.uid)
            }

            default: {
                break
            }
        }
    }

    handleUpload = async (req) => {
        const response = await FilesModel.uploadFile(req.file, {
            timeout: 2000
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

    checkCanSubmit = () => {
        const { playlistName, fileList, pendingUploads, trackList } = this.state

        const nameValid = playlistName !== null && playlistName.length !== 0
        const filesListValid = fileList.length !== 0
        const isPending = pendingUploads.length !== 0
        const isTrackListValid = trackList.every((track) => {
            return track.title !== null && track.title?.length !== 0 && track.source !== null && track.source?.length !== 0
        })

        return nameValid && filesListValid && !isPending && isTrackListValid
    }

    handleSubmit = async () => {
        this.setState({
            loading: true
        })

        const { playlistName, playlistDescription, playlistThumbnail, trackList } = this.state

        let tracksIds = []

        // first, publish the tracks
        for await (const track of trackList) {
            console.log(track)

            let trackPublishResponse = null

            if (typeof track._id === "undefined") {
                console.log(`Track ${track.uid} is not published yet. Publishing it...`)

                trackPublishResponse = await PlaylistModel.publishTrack({
                    title: track.title,
                    thumbnail: track.thumbnail,
                    source: track.source
                }).catch((error) => {
                    console.error(error)
                    app.message.error(error.response.data.message)

                    return false
                })
            } else {
                console.log(`Track ${track.uid} is already published. Updating...`)

                trackPublishResponse = await PlaylistModel.updateTrack({
                    _id: track._id,
                    title: track.title,
                    thumbnail: track.thumbnail,
                    source: track.source
                }).catch((error) => {
                    console.error(error)
                    app.message.error(error.response.data.message)

                    return false
                })
            }

            if (trackPublishResponse) {
                tracksIds.push(trackPublishResponse._id)

                // update the track id in the track list
                const trackList = this.state.trackList

                const trackIndex = trackList.findIndex((track) => track.uid === track.uid)

                if (trackIndex !== -1) {
                    trackList[trackIndex]._id = trackPublishResponse._id.toString()
                }

                this.setState({
                    trackList: trackList
                })
            }
        }

        if (tracksIds.length === 0) {
            antd.message.error("Failed to publish tracks")

            this.setState({
                loading: false
            })

            return
        }

        let playlistPublishResponse = null

        if (this.props.playlist_id) {
            console.log(`Playlist ${this.props.playlist_id} is already published. Updating...`)

            // update the playlist
            playlistPublishResponse = await PlaylistModel.updatePlaylist({
                _id: this.props.playlist_id,
                title: playlistName,
                description: playlistDescription,
                thumbnail: playlistThumbnail,
                list: tracksIds
            }).catch((error) => {
                console.error(error)
                app.message.error(error.response.data.message)

                return false
            })
        } else {
            console.log(`Playlist is not published yet. Publishing it...`)

            playlistPublishResponse = await PlaylistModel.publish({
                title: playlistName,
                description: playlistDescription,
                thumbnail: playlistThumbnail,
                list: tracksIds
            }).catch((error) => {
                console.error(error)
                app.message.error(error.response.data.message)

                return false
            })
        }

        this.setState({
            loading: false
        })

        if (playlistPublishResponse) {
            app.message.success("Playlist published")

            if (typeof this.props.close === "function") {
                this.props.close()
            }
        }
    }

    handleDeletePlaylist = async () => {
        const action = async () => {
            this.setState({
                loading: true
            })

            const deleteResponse = await PlaylistModel.deletePlaylist(this.props.playlist_id).catch((error) => {
                console.error(error)
                antd.message.error(error)

                return false
            })

            this.setState({
                loading: false
            })

            if (deleteResponse) {
                app.message.success("Playlist deleted")

                if (typeof this.props.close === "function") {
                    this.props.close()
                }
            }
        }

        antd.Modal.confirm({
            title: "Delete playlist",
            content: "Are you sure you want to delete this playlist?",
            onOk: action
        })
    }

    __removeExtensionsFromNames = () => {
        this.setState({
            trackList: this.state.trackList.map((track) => {
                track.title = track.title.replace(/\.[^/.]+$/, "")

                return track
            })
        })
    }

    __removeNumbersFromNames = () => {
        // remove the order number from the track name ( 01 - trackname.ext => trackname.ext )
        this.setState({
            trackList: this.state.trackList.map((track) => {
                track.title = track.title.replace(/^[0-9]{2} - /, "")

                return track
            })
        })
    }

    loadData = async (playlist_id) => {
        const playlist = await PlaylistModel.getPlaylist(playlist_id).catch((error) => {
            console.error(error)
            antd.message.error(error)

            return false
        })

        if (playlist) {
            const trackList = playlist.list.map((track) => {
                return {
                    _id: track._id,
                    uid: track._id,
                    title: track.title,
                    source: track.source,
                    status: "done",
                    thumbnail: track.thumbnail
                }
            })

            this.setState({
                playlistName: playlist.title,
                playlistDescription: playlist.description,
                trackList: trackList,
                fileList: trackList.map((track) => {
                    return {
                        uid: track.uid,
                        name: track.title,
                        status: "done",
                        url: track.source
                    }
                })
            })
        }
    }

    componentDidMount() {
        console.log(this.props.playlist_id)

        if (this.props.playlist_id) {
            this.loadData(this.props.playlist_id)
        }

        window._hacks = {
            removeExtensionsFromNames: this.__removeExtensionsFromNames,
            removeNumbersFromNames: this.__removeNumbersFromNames
        }
    }

    componentWillUnmount() {
        window._hacks = null
    }

    render() {
        return <div className="playlistCreator">
            <div className="inputField">
                <Icons.MdOutlineMusicNote />
                <antd.Input
                    className="inputText"
                    placeholder="Playlist Title"
                    size="large"
                    bordered={false}
                    onChange={this.handleTitleOnChange}
                    maxLength={120}
                    value={this.state.playlistName}
                />
            </div>
            <div className="inputField">
                <Icons.MdOutlineDescription />

                <antd.Input.TextArea
                    className="inputText"
                    placeholder="Description (Support Markdown)"
                    bordered={false}
                    value={this.state.playlistDescription}
                    onChange={this.handleDescriptionOnChange}
                    maxLength={2500}
                    rows={4}
                />
            </div>
            <div className="inputField">
                <Icons.MdImage />

                {
                    this.state.playlistThumbnail && <div className="coverPreview">
                        <img src={this.state.playlistThumbnail} alt="cover" />

                        <antd.Button
                            onClick={() => {
                                this.setState({
                                    playlistThumbnail: null
                                })
                            }}
                            icon={<Icons.MdClose />}
                            shape="round"
                        >
                            Remove Cover
                        </antd.Button>
                    </div>
                }

                {
                    !this.state.playlistThumbnail && <UploadButton
                        onUploadDone={(file) => {
                            this.setState({
                                playlistThumbnail: file.url
                            })
                        }}
                        multiple={false}
                        accept="image/*"
                    >
                        Upload cover
                    </UploadButton>
                }
            </div>

            <div className="files">
                <antd.Upload
                    className="uploader"
                    customRequest={this.handleUpload}
                    onChange={this.handleUploaderOnChange}
                    accept="audio/*"
                    multiple
                    showUploadList={false}
                >
                    {
                        this.state.fileList.length === 0 ?
                            <UploadHint /> : <antd.Button icon={<Icons.MdCloudUpload />}>
                                Upload files
                            </antd.Button>
                    }
                </antd.Upload>

                <DragDropContext onDragEnd={this.onDragEnd}>
                    <Droppable droppableId="droppable">
                        {(provided, snapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="fileList"
                            >
                                {
                                    this.state.trackList.map((track, index) => {
                                        return <FileListItem
                                            index={index}
                                            track={track}
                                            onClickChangeCover={() => {
                                                return this.handleTrackCoverChange(track.uid)
                                            }}
                                            onTitleChange={(event) => {
                                                return this.handleTrackTitleOnChange(event, track.uid)
                                            }}
                                            onClickRemove={() => {
                                                return this.removeTrack(track.uid)
                                            }}
                                        />
                                    })
                                }
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>

            <div>
                {
                    this.state.pendingUploads.length !== 0 && <div className="pendingUploads">
                        <p>
                            <Icons.MdCloudUpload />
                            <span>
                                {this.state.pendingUploads.length} file(s) are being uploaded
                            </span>
                        </p>
                    </div>
                }
            </div>

            <div className="actions">
                <antd.Button
                    type="primary"
                    size="large"
                    disabled={!this.checkCanSubmit()}
                    icon={<Icons.MdCampaign />}
                    loading={this.state.loading}
                    onClick={this.handleSubmit}
                >
                    Publish
                </antd.Button>

                {
                    this.props.playlist_id && <antd.Button
                        type="link"
                        onClick={this.handleDeletePlaylist}
                        danger
                    >
                        Delete Playlist
                    </antd.Button>
                }
            </div>

            <div className="footer">
                <p>
                    Uploading files that are not permitted by our <a onClick={() => app.setLocation("/terms")}>Terms of Service</a> may result in your account being suspended.
                </p>
            </div>
        </div>
    }
}