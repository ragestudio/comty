import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import LikeButton from "components/LikeButton"
import { Icons } from "components/Icons"

import SeekBar from "components/Player/SeekBar"
import Controls from "components/Player/Controls"
import { WithPlayerContext, Context } from "contexts/WithPlayerContext"

import "./index.less"

export default (props) => {
    return <WithPlayerContext>
        <AudioPlayer
            {...props}
        />
    </WithPlayerContext>
}

const ServiceIndicator = (props) => {
    if (!props.service) {
        return null
    }

    switch (props.service) {
        case "tidal": {
            return <div className="service_indicator">
                <Icons.SiTidal /> Playing from Tidal
            </div>
        }
        default: {
            return null
        }
    }
}

// TODO: Queue view
export class AudioPlayer extends React.Component {
    static contextType = Context

    state = {
        showControls: false,
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
        app.location.push("/lyrics")
    }

    inviteSync = () => {
        app.cores.sync.music.createSyncRoom()
    }

    updateVolume = (value) => {
        app.cores.player.volume(value)
    }

    toggleMute = () => {
        app.cores.player.toggleMute()
    }

    onClickPlayButton = () => {
        if (this.context.streamMode) {
            return app.cores.player.playback.stop()
        }

        app.cores.player.playback.toggle()
    }

    onClickPreviousButton = () => {
        app.cores.player.playback.previous()
    }

    onClickNextButton = () => {
        app.cores.player.playback.next()
    }

    render() {
        return <div
            className={classnames(
                "embbededMediaPlayerWrapper",
                {
                    ["hovering"]: this.props.frame !== false && this.state.showControls,
                    ["minimized"]: !app.isMobile && this.context.minimized,
                    ["no-frame"]: this.props.frame === false,
                }
            )}
            onMouseEnter={this.onMouse}
            onMouseLeave={this.onMouse}
        >
            {
                !app.isMobile && <div className="top_controls">
                    <antd.Button
                        icon={<Icons.MdFirstPage />}
                        onClick={this.minimize}
                        shape="circle"
                    />

                    {
                        !this.context.syncModeLocked && !this.context.syncMode && <antd.Button
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
            }

            <div className="player">
                <ServiceIndicator
                    service={this.context.currentManifest?.service}
                />

                <div
                    className="cover"
                    style={{
                        backgroundImage: `url(${(this.context.currentManifest?.cover ?? this.context.currentManifest?.thumbnail) ?? "/assets/no_song.png"})`,
                    }}
                />
                <div className="header">
                    <div className="info">
                        <div className="title">
                            <h2>
                                {
                                    this.context.currentManifest?.title
                                        ? this.context.currentManifest?.title
                                        : (this.context.loading ? "Loading..." : (this.context.currentPlaying?.title ?? "Untitled"))
                                }
                            </h2>
                        </div>
                        <div className="subTitle">
                            {
                                this.context.currentManifest?.artist && <div className="artist">
                                    <h3>
                                        {this.context.currentManifest?.artist ?? "Unknown"}
                                    </h3>
                                </div>
                            }

                            {
                                !app.isMobile && this.context.playbackStatus !== "stopped" && <LikeButton
                                    onClick={app.cores.player.toggleCurrentTrackLike}
                                    liked={this.context.liked}
                                />
                            }
                        </div>
                    </div>
                </div>

                <Controls
                    syncModeLocked={this.context.syncModeLocked}
                    syncMode={this.context.syncMode}
                    playbackStatus={this.context.playbackStatus}
                    audioMuted={this.context.audioMuted}
                    audioVolume={this.context.audioVolume}
                    onVolumeUpdate={this.updateVolume}
                    onMuteUpdate={this.toggleMute}
                    controls={{
                        previous: this.onClickPreviousButton,
                        toggle: this.onClickPlayButton,
                        next: this.onClickNextButton,
                        like: app.cores.player.toggleCurrentTrackLike,
                    }}
                    liked={this.context.liked}
                />

                <SeekBar
                    stopped={this.context.playbackStatus === "stopped"}
                    playing={this.context.playbackStatus === "playing"}
                    streamMode={this.context.streamMode}
                    disabled={this.context.syncModeLocked}
                />
            </div>
        </div>
    }
}