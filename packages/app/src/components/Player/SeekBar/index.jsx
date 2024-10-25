import React from "react"
import * as antd from "antd"
import Slider from "@mui/material/Slider"
import classnames from "classnames"

import seekToTimeLabel from "@utils/seekToTimeLabel"

import "./index.less"

export default class SeekBar extends React.Component {
    state = {
        playing: app.cores.player.state["playback_status"] === "playing",
        timeText: "00:00",
        durationText: "00:00",
        sliderTime: 0,
        sliderLock: false,
    }

    handleSeek = (value) => {
        if (value > 0) {
            // calculate the duration of the audio
            const duration = app.cores.player.controls.duration()

            // calculate the seek of the audio
            const seek = (value / 100) * duration

            app.cores.player.controls.seek(seek)
        } else {
            app.cores.player.controls.seek(0)
        }
    }

    calculateDuration = (preCalculatedDuration) => {
        // get current audio duration
        const audioDuration = preCalculatedDuration ?? app.cores.player.controls.duration()

        if (isNaN(audioDuration)) {
            return
        }

        // set duration
        this.setState({
            durationText: seekToTimeLabel(audioDuration)
        })
    }

    calculateTime = () => {
        // get current audio seek
        const seek = app.cores.player.controls.seek()

        // set time
        this.setState({
            timeText: seekToTimeLabel(seek)
        })
    }

    updateProgressBar = () => {
        if (this.state.sliderLock) {
            return
        }

        const seek = app.cores.player.controls.seek()
        const duration = app.cores.player.controls.duration()

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
        // handle when player changes playback status
        "player.state.update:playback_status": (status) => {
            this.setState({
                playing: status === "playing",
            })

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
        // handle when player changes track
        "player.state.update:track_manifest": (manifest) => {
            if (!manifest) {
                return false
            }

            this.updateAll()

            this.setState({
                timeText: "00:00",
                sliderTime: 0,
            })

            this.calculateDuration(manifest.metadata?.duration ?? manifest.duration)
        },
        "player.seeked": (seek) => {
            this.calculateTime()
            this.updateAll()
        },
    }

    tick = () => {
        if (this.state.playing) {
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
        this.updateAll()
        this.tick()

        for (const [event, callback] of Object.entries(this.events)) {
            app.cores.player.eventBus().on(event, callback)
        }
    }

    componentWillUnmount = () => {
        for (const [event, callback] of Object.entries(this.events)) {
            app.cores.player.eventBus().off(event, callback)
        }
    }

    componentDidUpdate = (prevProps, prevState) => {
        if (this.state.playing !== prevState.playing) {
            this.tick()
        }
    }

    render() {
        return <div
            className={classnames(
                "player-seek_bar",
                {
                    ["stopped"]: this.props.stopped,
                }
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
                    disabled={this.props.stopped || this.props.streamMode || this.props.disabled}
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
                        return seekToTimeLabel((value / 100) * app.cores.player.controls.duration())
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
