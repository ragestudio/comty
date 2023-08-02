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

const MemeDancer = (props) => {
    const defaultBpm = 120
    const [currentBpm, setCurrentBpm] = React.useState(defaultBpm)

    const videoRef = React.useRef()

    const togglePlayback = (to) => {
        videoRef.current[to ? "play" : "pause"]()
    }

    React.useEffect(() => {
        app.cores.player.eventBus.on("bpm.change", (bpm) => {
            setCurrentBpm(bpm)
        })

        app.cores.player.eventBus.on("player.state.update:playback_status", (status) => {
            if (status === "playing") {
                togglePlayback(true)
            }else {
                togglePlayback(false)
            }
        })
    }, [])

    React.useEffect(() => {
        if (typeof currentBpm === "number" && isFinite(currentBpm)) {
            let playbackRate = currentBpm / 120;
            playbackRate = Math.min(4.0, Math.max(0.1, playbackRate)); // Limit the range between 0.1 and 4.0
            videoRef.current.playbackRate = playbackRate;
        }
    }, [currentBpm])

    return <div className="meme_dancer">
        <video
            ref={videoRef}
            muted
            autoPlay
            loop
            controls={false}
        >
            <source
                src="https://media.tenor.com/-VG9cLwSYTcAAAPo/dancing-triangle-dancing.mp4"
            />
        </video>
    </div>
}

// TODO: Queue view
export class AudioPlayer extends React.Component {
    static contextType = Context

    state = {
        showControls: false,
        showDancer: false,
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
        if (this.context.sync_mode) {
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

    toggleDancer = () => {
        this.setState({ showDancer: !this.state.showDancer })
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
                        !this.context.control_locked && !this.context.sync_mode && <antd.Button
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
                {
                    this.state.showDancer && <MemeDancer />
                }

                <ServiceIndicator
                    service={this.context.track_manifest?.service}
                />

                <div
                    className="cover"
                    style={{
                        backgroundImage: `url(${(this.context.track_manifest?.cover ?? this.context.track_manifest?.thumbnail) ?? "/assets/no_song.png"})`,
                    }}
                />
                <div className="header">
                    <div className="info">
                        <div className="title">
                            <h2 onDoubleClick={this.toggleDancer}>
                                {
                                    this.context.track_manifest?.title
                                        ? this.context.track_manifest?.title
                                        : (this.context.loading ? "Loading..." : (this.context.track_manifest?.metadata?.title ?? "Untitled"))
                                }
                            </h2>
                        </div>
                        <div className="subTitle">
                            {
                                this.context.track_manifest?.metadata?.artist && <div className="artist">
                                    <h3>
                                        {this.context.track_manifest?.metadata?.artist ?? "Unknown"}
                                    </h3>
                                </div>
                            }

                            {
                                !app.isMobile && this.context.playback_status !== "stopped" && <LikeButton
                                    //onClick={app.cores.player.toggleCurrentTrackLike}
                                    liked={this.context.track_manifest?.metadata?.liked}
                                />
                            }
                        </div>
                    </div>
                </div>

                <Controls
                    syncModeLocked={this.context.control_locked}
                    syncMode={this.context.sync_mode}
                    playbackStatus={this.context.playback_status}
                    audioMuted={this.context.muted}
                    audioVolume={this.context.volume}
                    onVolumeUpdate={this.updateVolume}
                    onMuteUpdate={this.toggleMute}
                    controls={{
                        previous: this.onClickPreviousButton,
                        toggle: this.onClickPlayButton,
                        next: this.onClickNextButton,
                        //like: app.cores.player.toggleCurrentTrackLike,
                    }}
                    liked={this.context.track_manifest?.metadata?.liked}
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