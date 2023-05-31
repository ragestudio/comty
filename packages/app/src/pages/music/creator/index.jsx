import React from "react"
import * as antd from "antd"
import jsmediatags from "jsmediatags/dist/jsmediatags.min.js"

import PlaylistModel from "models/playlists"

import BasicInformation from "./components/BasicInformation"
import TracksUploads from "./components/TracksUploads"

import "./index.less"

const allowedTrackFieldChanges = [
    "title",
    "artist",
    "cover",
    "thumbnail",
    "album",
    "year",
    "genre",
    "comment",
    "explicit",
    "lyricsEnabled",
    "spotifyId",
    "public",
]

function createDefaultTrackData({
    uid,
    status = "uploading",
    title,
    artist,
    album,
    source,
    cover = "https://storage.ragestudio.net/comty-static-assets/default_song.png",
    lyricsEnabled = false,
    explicit = false,
    spotifyId = null,
}) {
    return {
        uid: uid,
        title: title,
        artist: artist,
        album: album,
        source: source,
        status: status,
        cover: cover,
        lyricsEnabled: lyricsEnabled,
        explicit: explicit,
        spotifyId: spotifyId,
    }
}

export default class PlaylistCreatorSteps extends React.Component {
    state = {
        playlistData: {},

        fileList: [],
        trackList: [],
        pendingTracksUpload: [],

        loading: true,
        submitting: false,

        currentStep: 0,
    }

    _hacks = {
        revertTrackOrders: () => {
            this.setState({
                trackList: this.state.trackList.reverse()
            })
        }
    }

    updatePlaylistData = (key, value) => {
        this.setState({
            playlistData: {
                ...this.state.playlistData,
                [key]: value
            }
        })
    }

    updateTrackList = (trackList) => {
        this.setState({
            trackList
        })
    }

    canSubmit = () => {
        const { playlistData, trackList, pendingTracksUpload } = this.state

        const hasValidTitle = playlistData.title && playlistData.title.length > 0
        const hasTracks = trackList.length > 0
        const hasPendingUploads = pendingTracksUpload.length > 0
        const tracksHasValidData = trackList.every((track) => {
            return track.title !== null && track.title?.length !== 0 && track.source !== null && track.source?.length !== 0
        })

        return hasValidTitle && hasTracks && !hasPendingUploads && tracksHasValidData
    }

    submit = async () => {
        this.setState({
            submitting: true
        })

        const { playlistData, trackList } = this.state

        console.log(`Submitting playlist ${playlistData.title} with ${trackList.length} tracks`, playlistData, trackList)

        const result = await PlaylistModel.putPlaylist({
            ...playlistData,
            list: trackList,
        })

        this.setState({
            submitting: false
        })

        if (result) {
            app.message.success("Playlist published")

            if (typeof this.props.onModification === "function") {
                this.props.onModification()
            }

            if (typeof this.props.close === "function") {
                this.props.close()
            }
        }
    }

    // TRACK UPLOADS METHODS
    analyzeTrackMetadata = async (file) => {
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

    handleUploadTrack = async (req) => {
        const response = await app.cores.remoteStorage.uploadFile(req.file, {
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

    handleTrackDragEnd = (result) => {
        if (!result.destination) {
            return
        }

        const trackList = this.state.trackList

        const [removed] = trackList.splice(result.source.index, 1)

        trackList.splice(result.destination.index, 0, removed)

        this.setState({
            trackList,
        })
    }

    handleTrackRemove = (uid) => {
        this.setState({
            fileList: this.state.fileList.filter((file) => file.uid !== uid),
            trackList: this.state.trackList.filter((file) => file.uid !== uid),
            pendingTracksUpload: this.state.pendingTracksUpload.filter((file_uid) => file_uid !== uid)
        })
    }

    handleTrackInfoChange = (uid, key, value) => {
        if (!uid) {
            console.error(`Cannot update track withouth uid`)
            return
        }

        let trackList = this.state.trackList

        const track = trackList.find((track) => track.uid === uid)

        if (typeof key === "object") {
            allowedTrackFieldChanges.forEach((_key) => {
                if (typeof key[_key] !== "undefined") {
                    track[_key] = key[_key]
                }
            })
        } else {
            if (!allowedTrackFieldChanges.includes(key)) {
                console.error(`Cannot update track with key ${key}`)
                return
            }

            track[key] = value
        }

        this.setState({
            trackList: trackList
        })

        console.log(`New data for track ${uid}: `, this.state.trackList.find((track) => track.uid === uid))
    }

    handleTrackCoverChange = async (uid, file) => {
        if (!uid) {
            console.error(`Cannot update track withouth uid`)
            return
        }

        // upload cover file
        const result = await app.cores.remoteStorage.uploadFile(file, {
            timeout: 2000
        })

        console.log(`Uploaded cover for track ${uid}: `, result)

        if (result) {
            this.handleTrackInfoChange(uid, "cover", result.url)
        }
    }

    handleDeletePlaylist = async () => {
        if (!this.props.playlist_id) {
            console.error(`Cannot delete playlist without id`)
            return
        }

        antd.Modal.confirm({
            title: "Are you sure you want to delete this playlist?",
            content: "This action cannot be undone",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                const result = await PlaylistModel.deletePlaylist(this.props.playlist_id)

                if (result) {
                    app.message.success("Playlist deleted")

                    if (typeof this.props.onModification === "function") {
                        this.props.onModification()
                    }

                    if (typeof this.props.close === "function") {
                        this.props.close()
                    }
                }
            }
        })
    }

    onTrackUploaderChange = async (change) => {
        switch (change.file.status) {
            case "uploading": {
                const { pendingTracksUpload } = this.state

                if (!pendingTracksUpload.includes(change.file.uid)) {
                    pendingTracksUpload.push(change.file.uid)
                }

                const trackMetadata = await this.analyzeTrackMetadata(change.file.originFileObj)
                    .catch((error) => {
                        console.error(`Failed to analyze track metadata: `, error)

                        // return empty metadata
                        return {
                            tags: {}
                        }
                    })

                console.log(trackMetadata)

                if (trackMetadata.tags.picture) {
                    const data = trackMetadata.tags.picture.data
                    const format = trackMetadata.tags.picture.format

                    if (data && format) {
                        console.log(data, format)

                        const filenameExt = format.split("/")[1]
                        const filename = `cover.${filenameExt}`

                        const byteArray = new Uint8Array(data)
                        const blob = new Blob([byteArray], { type: data.type })

                        // create a file object
                        const file = new File([blob], filename, {
                            type: format,
                        })

                        console.log(file)

                        this.handleTrackCoverChange(change.file.uid, file)
                    }
                }

                this.setState({
                    pendingTracksUpload: pendingTracksUpload,
                    fileList: [...this.state.fileList, change.file],
                    trackList: [...this.state.trackList, createDefaultTrackData({
                        uid: change.file.uid,
                        title: trackMetadata.tags.title ?? change.file.name,
                        artist: trackMetadata.tags.artist ?? null,
                        album: trackMetadata.tags.album ?? null,
                        tags: trackMetadata.tags,
                    })]
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

    steps = [
        {
            title: "Information",
            crender: BasicInformation,
        },
        {
            title: "Tracks",
            crender: TracksUploads,
        }
    ]

    onChangeStep = (toStep) => {
        // check if can change step
        if (toStep > this.state.currentStep) {
            if (!this.canNextStep()) {
                return
            }
        }

        this.setState({
            currentStep: toStep
        })
    }

    nextStep = () => {
        if (!this.canNextStep()) {
            return
        }

        const nextStep = this.state.currentStep + 1

        if (nextStep >= this.steps.length) {
            return this.submit()
        }

        this.setState({
            currentStep: nextStep
        })
    }

    previousStep = () => {
        const previusStep = this.state.currentStep - 1

        if (previusStep < 0) {
            return
        }

        this.setState({
            currentStep: previusStep
        })
    }

    canNextStep = () => {
        // check current step
        switch (this.state.currentStep) {
            case 0:
                return typeof this.state.playlistData.title === "string" && this.state.playlistData.title.length > 0
            case 1:
                return this.canSubmit()
            default:
                return true
        }
    }

    componentDidMount() {
        window._hacks = this._hacks

        if (this.props.playlist_id) {
            this.loadPlaylistData(this.props.playlist_id)
        } else {
            this.setState({
                loading: false
            })
        }
    }

    componentWillUnmount() {
        delete window._hacks
    }

    loadPlaylistData = async (playlist_id) => {
        console.log(`Loading playlist data for playlist ${playlist_id}...`)

        const playlistData = await PlaylistModel.getPlaylist(playlist_id).catch((error) => {
            console.error(error)
            antd.message.error(error)

            return false
        })

        if (playlistData) {
            const trackList = playlistData.list.map((track) => {
                return {
                    ...track,
                    _id: track._id,
                    uid: track._id,
                    status: "done",
                }
            })

            this.setState({
                playlistData: playlistData,
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

        this.setState({
            loading: false
        })
    }

    render() {
        if (this.state.loading) {
            return <antd.Skeleton active />
        }

        return <div className="playlistCreator">
            <antd.Steps
                direction="horizontal"
                current={this.state.currentStep}
                onChange={this.onChangeStep}
                items={this.steps}
            />

            <div className="stepContent">
                {
                    React.createElement(this.steps[this.state.currentStep].crender, {
                        playlist: this.state.playlistData,

                        trackList: this.state.trackList,
                        fileList: this.state.fileList,

                        onTitleChange: (title) => {
                            this.updatePlaylistData("title", title)
                        },
                        onDescriptionChange: (description) => {
                            this.updatePlaylistData("description", description)
                        },
                        onPlaylistCoverChange: (url) => {
                            this.updatePlaylistData("cover", url)
                        },
                        onVisibilityChange: (visibility) => {
                            this.updatePlaylistData("public", visibility)
                        },
                        onDeletePlaylist: this.handleDeletePlaylist,

                        handleUploadTrack: this.handleUploadTrack,
                        handleTrackDragEnd: this.handleTrackDragEnd,
                        handleTrackRemove: this.handleTrackRemove,
                        handleTrackInfoChange: this.handleTrackInfoChange,
                        onTrackUploaderChange: this.onTrackUploaderChange,
                    })
                }
            </div>

            <div className="stepActions">
                <antd.Button
                    onClick={this.previousStep}
                    disabled={this.state.currentStep === 0}
                >
                    Previous
                </antd.Button>

                <antd.Button
                    type="primary"
                    onClick={this.nextStep}
                    disabled={!this.canNextStep()}
                >
                    {
                        this.state.currentStep === this.steps.length - 1 ? "Finish" : "Next"
                    }
                </antd.Button>
            </div>
        </div>
    }
}