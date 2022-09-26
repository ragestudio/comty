import React from "react"
import * as antd from "antd"

import { Icons } from "components/Icons"

import "./index.less"

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

const PlayerStatus = React.memo((props) => {
    const [playing, setPlaying] = React.useState(false)
    const [time, setTime] = React.useState("00:00")
    const [duration, setDuration] = React.useState("00:00")
    const [progressBar, setProgressBar] = React.useState(0)

    const updateDuration = () => {
        const audioDuration = app.AudioPlayer.currentAudio.instance.duration()

        // convert duration to minutes and seconds
        const minutes = Math.floor(audioDuration / 60)

        // add leading zero if minutes is less than 10
        const minutesString = minutes < 10 ? `0${minutes}` : minutes

        // get seconds
        const seconds = Math.floor(audioDuration - minutes * 60)

        // add leading zero if seconds is less than 10
        const secondsString = seconds < 10 ? `0${seconds}` : seconds

        // set duration
        setDuration(`${minutesString}:${secondsString}`)
    }

    const updateTimer = () => {
        // get audio seek
        const seek = app.AudioPlayer.currentAudio.instance.seek()

        // convert seek to minutes and seconds
        const minutes = Math.floor(seek / 60)

        // add leading zero if minutes is less than 10
        const minutesString = minutes < 10 ? `0${minutes}` : minutes

        // get seconds
        const seconds = Math.floor(seek - minutes * 60)

        // add leading zero if seconds is less than 10
        const secondsString = seconds < 10 ? `0${seconds}` : seconds

        // set time
        setTime(`${minutesString}:${secondsString}`)
    }

    const updateProgressBar = () => {
        const seek = app.AudioPlayer.currentAudio.instance.seek()
        const duration = app.AudioPlayer.currentAudio.instance.duration()

        const percent = (seek / duration) * 100

        setProgressBar(percent)
    }

    const onUpdateSeek = (value) => {
        // calculate the duration of the audio
        const duration = app.AudioPlayer.currentAudio.instance.duration()

        // calculate the seek of the audio
        const seek = (value / 100) * duration

        // update the progress bar
        setProgressBar(value)

        // seek to the new value
        app.AudioPlayer.currentAudio.instance.seek(seek)
    }

    const tooltipFormatter = (value) => {
        if (!app.AudioPlayer.currentAudio) {
            return "00:00"
        }

        const duration = app.AudioPlayer.currentAudio.instance.duration()

        const seek = (value / 100) * duration

        // convert seek to minutes and seconds
        const minutes = Math.floor(seek / 60)

        // add leading zero if minutes is less than 10
        const minutesString = minutes < 10 ? `0${minutes}` : minutes

        // get seconds
        const seconds = Math.floor(seek - minutes * 60)

        // add leading zero if seconds is less than 10
        const secondsString = seconds < 10 ? `0${seconds}` : seconds

        return `${minutesString}:${secondsString}`
    }

    // create a interval when audio is playing, and destroy it when audio is paused
    React.useEffect(() => {
        const interval = setInterval(() => {
            if (app.AudioPlayer.currentAudio) {
                updateTimer()
                updateProgressBar()
            }
        }, 1000)

        return () => {
            clearInterval(interval)
        }
    }, [playing])

    const events = {
        "audioPlayer.seeked": () => {
            updateTimer()
            updateProgressBar()
        },
        "audioPlayer.playing": () => {
            updateDuration()
            updateTimer()
            updateProgressBar()
        },
        "audioPlayer.paused": () => {
            setPlaying(false)
        },
        "audioPlayer.stopped": () => {
            setPlaying(false)
        }
    }

    React.useEffect(() => {
        // listen events
        for (const [event, callback] of Object.entries(events)) {
            app.eventBus.on(event, callback)
        }

        return () => {
            // remove events
            for (const [event, callback] of Object.entries(events)) {
                app.eventBus.off(event, callback)
            }
        }
    }, [])

    return <div className="status">
        <div className="progress">
            <antd.Slider
                value={progressBar}
                onAfterChange={onUpdateSeek}
                tooltip={{ formatter: tooltipFormatter }}
                disabled={!app.AudioPlayer.currentAudio}
            />
        </div>
        <div className="timers">
            <div>
                <span>{time}</span>
            </div>
            <div>
                <span>{duration}</span>
            </div>
        </div>
    </div>
})

export default (props) => {
    const [mute, setMute] = React.useState(app.AudioPlayer.audioMuted)
    const [volume, setVolume] = React.useState(app.AudioPlayer.audioVolume)

    const [currentPlaying, setCurrentPlaying] = React.useState(null)
    const [playing, setPlaying] = React.useState(false)
    const [loading, setLoading] = React.useState(true)

    const toogleMute = () => {
        setMute(app.AudioPlayer.toogleMute())
    }

    const updateVolume = (value) => {
        console.log("Updating volume", value)

        setVolume(app.AudioPlayer.setVolume(value))

        if (value > 0) {
            setMute(false)
        }
    }

    const onClickPlayButton = () => {
        setPlaying(!playing)

        if (playing) {
            app.AudioPlayer.pauseAudioQueue()
        } else {
            app.AudioPlayer.playCurrentAudio()
        }
    }

    const onClickNextButton = () => {
        app.AudioPlayer.nextAudio()
    }

    const onClickPreviousButton = () => {
        app.AudioPlayer.previousAudio()
    }

    const busEvents = {
        "audioPlayer.playing": (data) => {
            if (data) {
                setCurrentPlaying(data)
            }

            setLoading(false)
            setPlaying(true)
        },
        "audioPlayer.pause": () => {
            setPlaying(false)
        },
        "audioPlayer.stopped": () => {
            setPlaying(false)
        },
        "audioPlayer.loaded": () => {
            setLoading(false)
        },
        "audioPlayer.loading": () => {
            setLoading(true)
        }
    }

    // listen to events
    React.useEffect(() => {
        for (const event in busEvents) {
            app.eventBus.on(event, busEvents[event])
        }

        return () => {
            for (const event in busEvents) {
                app.eventBus.off(event, busEvents[event])
            }
        }
    }, [])

    console.log(currentPlaying)

    return <div className="embbededMediaPlayerWrapper">
        <div
            className="cover"
            style={{
                backgroundImage: `url(${(currentPlaying?.cover) ?? "/assets/no_song.png"})`,
            }}
        />

        <div className="player">
            <div className="header">
                <div className="info">
                    <div className="title">
                        <h2>
                            {loading ? "Loading..." : (currentPlaying?.title ?? "Untitled")}
                        </h2>
                    </div>
                    <div>
                        {
                            !loading && <div className="artist">
                                <h3>
                                    {currentPlaying?.artist ?? "Unknown"}
                                </h3>
                            </div>
                        }
                    </div>
                </div>
                <div className="indicators">
                    {loading ?
                        <antd.Spin /> :
                        <>
                            <Icons.MdOutlineExplicit />
                            <Icons.MdOutlineHighQuality />
                        </>}
                </div>
            </div>

            <div className="controls">
                <div>
                    <antd.Button
                        type="ghost"
                        shape="round"
                        onClick={onClickPreviousButton}
                        icon={<Icons.ChevronLeft />}
                    />
                </div>
                <div className="playButton">
                    <antd.Button
                        type="primary"
                        shape="circle"
                        icon={playing ? <Icons.Pause /> : <Icons.Play />}
                        onClick={onClickPlayButton}
                    />
                </div>
                <div>
                    <antd.Button
                        type="ghost"
                        shape="round"
                        onClick={onClickNextButton}
                        icon={<Icons.ChevronRight />}
                    />
                </div>
                <antd.Popover content={React.createElement(AudioVolume, { onChange: updateVolume, defaultValue: volume })} trigger="hover">
                    <div
                        onClick={toogleMute}
                        className="muteButton"
                    >
                        {mute ? <Icons.VolumeX /> : <Icons.Volume2 />}
                    </div>
                </antd.Popover>
            </div>
        </div>

        <PlayerStatus />
    </div>
}