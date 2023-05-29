import React from "react"
import * as antd from "antd"
import Slider from "@mui/material/Slider"
import classnames from "classnames"

import "./index.less"

export default class SeekBar extends React.Component {
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
                "player-seek_bar",
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
