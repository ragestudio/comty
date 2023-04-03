import React from "react"
import * as antd from "antd"
import Slider from "@mui/material/Slider"
import classnames from "classnames"

import UseAnimations from "react-useanimations"
import LoadingAnimation from "react-useanimations/lib/loading"

import { Icons, createIconRender } from "components/Icons"

import "./index.less"

// TODO: Check AUDIO quality and show a quality indicator
// TODO: Add close button
// TODO: Add repeat & shuffle mode
// TODO: Queue view

const AudioVolume = (props) => {
    return <div className="volumeSlider">
        <antd.Slider
            min={0}
            max={1}
            step={0.01}
            value={props.volume}
            onAfterChange={props.onChange}
            defaultValue={props.defaultValue}
            tooltip={{
                formatter: (value) => {
                    return `${Math.round(value * 100)}%`
                }
            }}
            vertical
        />
    </div>
}

class SeekBar extends React.Component {
    state = {
        timeText: "00:00",
        durationText: "00:00",
        sliderTime: 0,
        sliderLock: false,
    }

    handleSeek = (value) => {
        if (value > 0) {
            // calculate the duration of the audio
            const duration = app.cores.player.duration()

            // calculate the seek of the audio
            const seek = (value / 100) * duration

            app.cores.player.seek(seek)
        } else {
            app.cores.player.seek(0)
        }
    }

    calculateDuration = () => {
        // get current audio duration
        const audioDuration = app.cores.player.duration()

        if (isNaN(audioDuration)) {
            return
        }

        console.log(`Audio duration: ${audioDuration}`)

        // set duration
        this.setState({
            durationText: this.seekToTimeLabel(audioDuration)
        })
    }

    calculateTime = () => {
        // get current audio seek
        const seek = app.cores.player.seek()

        // set time
        this.setState({
            timeText: this.seekToTimeLabel(seek)
        })
    }

    seekToTimeLabel = (value) => {
        // convert seek to minutes and seconds
        const minutes = Math.floor(value / 60)

        // add leading zero if minutes is less than 10
        const minutesString = minutes < 10 ? `0${minutes}` : minutes

        // get seconds
        const seconds = Math.floor(value - minutes * 60)

        // add leading zero if seconds is less than 10
        const secondsString = seconds < 10 ? `0${seconds}` : seconds

        return `${minutesString}:${secondsString}`
    }

    updateProgressBar = () => {
        if (this.state.sliderLock) {
            return
        }

        const seek = app.cores.player.seek()
        const duration = app.cores.player.duration()

        const percent = (seek / duration) * 100

        this.setState({
            sliderTime: percent
        })
    }

    updateAll = () => {
        this.calculateTime()
        this.updateProgressBar()
    }

    events = {
        "player.status.update": (status) => {
            console.log(`Player status updated: ${status}`)

            switch (status) {
                case "stopped":
                    this.setState({
                        timeText: "00:00",
                        durationText: "00:00",
                        sliderTime: 0,
                    })

                    break
                case "playing":
                    this.updateAll()
                    this.calculateDuration()

                    break
                default:
                    break
            }
        },
        "player.current.update": (currentAudioManifest) => {
            console.log(`Player current audio updated:`, currentAudioManifest)

            this.updateAll()

            this.setState({
                timeText: "00:00",
                sliderTime: 0,
            })

            this.calculateDuration()
        },
        "player.duration.update": (duration) => {
            console.log(`Player duration updated: ${duration}`)

            this.calculateDuration()
        },
        "player.seek.update": (seek) => {
            console.log(`Player seek updated: ${seek}`)

            this.calculateTime()
            this.updateAll()
        },
    }

    tick = () => {
        if (this.props.playing || this.props.streamMode) {
            this.interval = setInterval(() => {
                this.updateAll()
            }, 1000)
        } else {
            if (this.interval) {
                clearInterval(this.interval)
            }
        }
    }

    componentDidMount = () => {
        this.calculateDuration()
        this.tick()

        for (const [event, callback] of Object.entries(this.events)) {
            app.eventBus.on(event, callback)
        }
    }

    componentWillUnmount = () => {
        for (const [event, callback] of Object.entries(this.events)) {
            app.eventBus.off(event, callback)
        }
    }

    componentDidUpdate = (prevProps, prevState) => {
        if (this.props.playing !== prevProps.playing) {
            this.tick()
        }
    }

    render() {
        return <div
            className={classnames(
                "status",
            )}
        >
            <div
                className={classnames(
                    "progress",
                    {
                        ["hidden"]: this.props.streamMode,
                    }
                )}
            >
                <Slider
                    size="small"
                    value={this.state.sliderTime}
                    disabled={this.props.stopped || this.props.streamMode}
                    min={0}
                    max={100}
                    step={0.1}
                    onChange={(_, value) => {
                        this.setState({
                            sliderTime: value,
                            sliderLock: true
                        })
                    }}
                    onChangeCommitted={() => {
                        this.setState({
                            sliderLock: false
                        })

                        this.handleSeek(this.state.sliderTime)

                        if (!this.props.playing) {
                            app.cores.player.playback.play()
                        }
                    }}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => {
                        return this.seekToTimeLabel((value / 100) * app.cores.player.duration())
                    }}
                />
            </div>
            <div className="timers">
                <div>
                    <span>{this.state.timeText}</span>
                </div>
                <div>
                    {
                        this.props.streamMode ? <antd.Tag>Live</antd.Tag> : <span>{this.state.durationText}</span>
                    }
                </div>
            </div>
        </div>
    }
}

const AudioPlayerChangeModeButton = (props) => {
    const [mode, setMode] = React.useState(app.cores.player.playback.mode())

    const modeToIcon = {
        "normal": "MdArrowForward",
        "repeat": "MdRepeat",
        "shuffle": "MdShuffle",
    }

    const onClick = () => {
        const modes = Object.keys(modeToIcon)

        const newMode = modes[(modes.indexOf(mode) + 1) % modes.length]

        app.cores.player.playback.mode(newMode)

        setMode(newMode)
    }

    return <antd.Button
        icon={createIconRender(modeToIcon[mode])}
        onClick={onClick}
        type="ghost"
    />
}

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
    }

    events = {
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
            console.log(`Player minimized updated: ${minimized}`)

            this.setState({
                minimized
            })
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
            <div className="player">
                <div className="minimize_btn">
                    <antd.Button
                        icon={<Icons.MdFirstPage />}
                        onClick={this.minimize}
                        shape="circle"
                    />
                </div>
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
                        <div>
                            {
                                currentPlaying?.artist && <div className="artist">
                                    <h3>
                                        {currentPlaying?.artist ?? "Unknown"}
                                    </h3>
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <div className="controls">
                    <AudioPlayerChangeModeButton />
                    <antd.Button
                        type="ghost"
                        shape="round"
                        icon={<Icons.ChevronLeft />}
                        onClick={this.onClickPreviousButton}
                    />
                    <antd.Button
                        type="primary"
                        shape="circle"
                        icon={this.state.streamMode ? <Icons.MdStop /> : playbackStatus === "playing" ? <Icons.Pause /> : <Icons.Play />}
                        onClick={this.onClickPlayButton}
                        className="playButton"
                    >
                        {
                            loading && <div className="loadCircle">
                                <UseAnimations
                                    animation={LoadingAnimation}
                                    size="100%"
                                />
                            </div>
                        }
                    </antd.Button>
                    <antd.Button
                        type="ghost"
                        shape="round"
                        icon={<Icons.ChevronRight />}
                        onClick={this.onClickNextButton}
                    />
                    <antd.Popover
                        content={React.createElement(
                            AudioVolume,
                            { onChange: this.updateVolume, defaultValue: audioVolume }
                        )}
                        trigger="hover"
                    >
                        <div
                            className="muteButton"
                            onClick={this.toogleMute}
                        >
                            {
                                audioMuted
                                    ? <Icons.VolumeX />
                                    : <Icons.Volume2 />
                            }
                        </div>
                    </antd.Popover>
                </div>

                <SeekBar
                    stopped={playbackStatus === "stopped"}
                    playing={playbackStatus === "playing"}
                    streamMode={this.state.streamMode}
                />
            </div>
        </div>
    }
}