import React from "react"
import { Skeleton } from "antd"

import VideoEditor from "./components/VideoEditor"
import LyricsEditor from "./components/LyricsEditor"

import MusicModel from "@models/music"

import ReleaseEditorStateContext from "@contexts/MusicReleaseEditor"

import "./index.less"

class EnhancedLyricsEditor extends React.Component {
    static contextType = ReleaseEditorStateContext

    state = {
        data: {},
        loading: true,
        submitting: false,
        videoOptions: {},
        lyricsOptions: {}
    }

    componentDidMount = async () => {
        this.setState({
            loading: true
        })

        this.context.setCustomPageActions([
            {
                label: "Save",
                icon: "FiSave",
                onClick: this.submitChanges,
            }
        ])

        const data = await MusicModel.getTrackLyrics(this.props.track._id).catch((err) => {
            return null
        })

        if (data) {
            this.setState({
                videoOptions: {
                    videoSourceURL: data.video_source,
                    startSyncAt: data.sync_audio_at
                },
                lyricsOptions: {
                    langs: data.lrc
                }
            })
        }

        this.setState({
            loading: false
        })
    }

    submitChanges = async () => {
        this.setState({
            submitting: true
        })

        console.log(`Submitting changes with values >`, {
            ...this.state.videoOptions,
            ...this.state.lyricsOptions
        })

        await MusicModel.putTrackLyrics(this.props.track._id, {
            video_source: this.state.videoOptions.videoSourceURL,
            sync_audio_at: this.state.videoOptions.startSyncAt,
            lrc: this.state.lyricsOptions.langs
        }).catch((err) => {
            console.error(err)
            app.message.error("Failed to update enhanced lyrics")
        })

        this.setState({
            submitting: false
        })
    }

    render() {
        if (this.state.loading) {
            return <Skeleton active />
        }

        return <div className="enhanced_lyrics_editor-wrapper">
            <h1>{this.props.track.title}</h1>

            <VideoEditor
                loading={this.state.submitting}
                videoSourceURL={this.state.videoOptions.videoSourceURL}
                startSyncAt={this.state.videoOptions.startSyncAt}
                onChange={(key, value) => {
                    this.setState({
                        videoOptions: {
                            ...this.state.videoOptions,
                            [key]: value
                        }
                    })
                }}
            />

            <LyricsEditor
                loading={this.state.submitting}
                langs={this.state.lyricsOptions.langs}
                onChange={(key, value) => {
                    this.setState({
                        lyricsOptions: {
                            ...this.state.lyricsOptions,
                            [key]: value
                        }
                    })
                }}
            />
        </div>
    }
}

export default EnhancedLyricsEditor