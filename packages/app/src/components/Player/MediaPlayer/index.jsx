import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import LikeButton from "components/LikeButton"
import { Icons } from "components/Icons"

import SeekBar from "components/Player/SeekBar"
import Controls from "components/Player/Controls"

import "./index.less"

// TODO: Queue view
export default class AudioPlayer extends React.Component {
    state = {
        loading: app.cores.player.getState("loading") ?? false,
        currentPlaying: app.cores.player.getState("currentAudioManifest"),
        playbackStatus: app.cores.player.getState("playbackStatus") ?? "stopped",
        audioMuted: app.cores.player.getState("audioMuted") ?? false,
        audioVolume: app.cores.player.getState("audioVolume") ?? 0.3,
        bpm: app.cores.player.getState("trackBPM") ?? 0,
        showControls: false,
        minimized: false,
        streamMode: false,

        syncModeLocked: app.cores.player.getState("syncModeLocked"),
        syncMode: app.cores.player.getState("syncMode"),
    }

    events = {
        "player.syncModeLocked.update": (to) => {
            this.setState({ syncModeLocked: to })
        },
        "player.syncMode.update": (to) => {
            this.setState({ syncMode: to })
        },
        "player.livestream.update": (data) => {
            this.setState({ streamMode: data })
        },
        "player.bpm.update": (data) => {
            this.setState({ bpm: data })
        },
        "player.loading.update": (data) => {
            this.setState({ loading: data })
        },
        "player.status.update": (data) => {
            this.setState({ playbackStatus: data })
        },
        "player.current.update": (data) => {
            this.setState({ currentPlaying: data })
        },
        "player.mute.update": (data) => {
            this.setState({ audioMuted: data })
        },
        "player.volume.update": (data) => {
            this.setState({ audioVolume: data })
        },
        "player.minimized.update": (minimized) => {
            this.setState({ minimized })
        }
    }

    componentDidMount = async () => {
        Object.entries(this.events).forEach(([event, callback]) => {
            app.eventBus.on(event, callback)
        })
    }

    componentWillUnmount() {
        Object.entries(this.events).forEach(([event, callback]) => {
            app.eventBus.off(event, callback)
        })
    }

    onMouse = (event) => {
        const { type } = event

        if (type === "mouseenter") {
            this.setState({ showControls: true })
        } else if (type === "mouseleave") {
            this.setState({ showControls: false })
        }
    }

    minimize = () => {
        app.cores.player.minimize()
    }

    close = () => {
        app.cores.player.close()
    }

    openVisualizer = () => {
        app.setLocation("/lyrics")
    }

    inviteSync = () => {
        app.cores.sync.music.createSyncRoom()
    }

    updateVolume = (value) => {
        app.cores.player.volume(value)
    }

    toogleMute = () => {
        app.cores.player.toogleMute()
    }

    onClickPlayButton = () => {
        if (this.state.streamMode) {
            return app.cores.player.playback.stop()
        }

        app.cores.player.playback.toogle()
    }

    onClickPreviousButton = () => {
        app.cores.player.playback.previous()
    }

    onClickNextButton = () => {
        app.cores.player.playback.next()
    }

    onClickLikeButton = () => {
        // TODO: Like

        console.log("Like")

        this.setState({ liked: !this.state.liked })
    }

    render() {
        const {
            loading,
            currentPlaying,
            playbackStatus,
            audioMuted,
            audioVolume,
        } = this.state

        return <div
            className={classnames(
                "embbededMediaPlayerWrapper",
                {
                    ["hovering"]: this.state.showControls,
                    ["minimized"]: this.state.minimized,
                }
            )}
            onMouseEnter={this.onMouse}
            onMouseLeave={this.onMouse}
        >
            <div className="top_controls">
                <antd.Button
                    icon={<Icons.MdFirstPage />}
                    onClick={this.minimize}
                    shape="circle"
                />

                {
                    !this.state.syncModeLocked && !this.state.syncMode && <antd.Button
                        icon={<Icons.MdShare />}
                        onClick={this.inviteSync}
                        shape="circle"
                    />
                }

                <antd.Button
                    icon={<Icons.MdOpenInFull />}
                    onClick={this.openVisualizer}
                    shape="circle"
                />

                <antd.Button
                    className="bottom_btn"
                    icon={<Icons.X />}
                    onClick={this.close}
                    shape="square"
                />
            </div>
            <div className="player">
                <div
                    className="cover"
                    style={{
                        backgroundImage: `url(${(currentPlaying?.thumbnail) ?? "/assets/no_song.png"})`,
                    }}
                />
                <div className="header">
                    <div className="info">
                        <div className="title">
                            <h2>
                                {
                                    currentPlaying?.title
                                        ? currentPlaying?.title
                                        : (loading ? "Loading..." : (currentPlaying?.title ?? "Untitled"))
                                }
                            </h2>
                        </div>
                        <div className="subTitle">
                            {
                                currentPlaying?.artist && <div className="artist">
                                    <h3>
                                        {currentPlaying?.artist ?? "Unknown"}
                                    </h3>
                                </div>
                            }

                            <LikeButton
                                onClick={this.onClickLikeButton}
                                liked={this.state.liked}
                            />
                        </div>
                    </div>
                </div>

                <Controls
                    syncModeLocked={this.state.syncModeLocked}
                    syncMode={this.state.syncMode}
                    playbackStatus={playbackStatus}
                    audioMuted={audioMuted}
                    audioVolume={audioVolume}
                    onVolumeUpdate={this.updateVolume}
                    onMuteUpdate={this.toogleMute}
                    controls={{
                        previous: this.onClickPreviousButton,
                        toogle: this.onClickPlayButton,
                        next: this.onClickNextButton,
                    }}
                />

                <SeekBar
                    stopped={playbackStatus === "stopped"}
                    playing={playbackStatus === "playing"}
                    streamMode={this.state.streamMode}
                    disabled={this.state.syncModeLocked}
                />
            </div>
        </div>
    }
}