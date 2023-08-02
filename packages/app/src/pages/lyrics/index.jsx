import React from "react"
import classnames from "classnames"
import Marquee from "react-fast-marquee"

import Image from "components/Image"

import Controls from "components/Player/Controls"

import { WithPlayerContext, Context } from "contexts/WithPlayerContext"

import request from "comty.js/handlers/request"

import "./index.less"

function composeRgbValues(values) {
    let value = ""

    // only get the first 3 values
    for (let i = 0; i < 3; i++) {
        // if last value, don't add comma
        if (i === 2) {
            value += `${values[i]}`
            continue
        }

        value += `${values[i]}, `
    }

    return value
}

function calculateLineTime(line) {
    if (!line) {
        return 0
    }

    return line.endTimeMs - line.startTimeMs
}

function isOverflown(element) {
    if (!element) {
        return false
    }

    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

class PlayerController extends React.Component {
    state = {
        colorAnalysis: null,
        currentDragWidth: 0,
        titleOverflown: false,

        currentDuration: 0,
        currentTime: 0,

        currentPlaying: app.cores.player.state["track_manifest"],
        loading: app.cores.player.state["loading"] ?? false,
        playbackStatus: app.cores.player.state["playback_status"] ?? "stopped",

        audioMuted: app.cores.player.state["muted"] ?? false,
        volume: app.cores.player.state["volume"],

        syncModeLocked: app.cores.player.state["control_locked"] ?? false,
        syncMode: app.cores.player.state["sync_mode"],
    }

    events = {
        "player.seeked": (seekTime) => {
            this.setState({
                currentTime: seekTime,
            })
        },
        "player.state.update:playback_status": (data) => {
            this.setState({ playbackStatus: data })
        },
        "player.state.update:track_manifest": (data) => {
            this.setState({ titleOverflown: false })

            this.setState({ currentPlaying: data })
        },
        "player.state.update:control_locked": (to) => {
            this.setState({ syncModeLocked: to })
        },
        "player.state.update:sync_mode": (to) => {
            this.setState({ syncMode: to })
        },
        "player.state.update:muted": (data) => {
            this.setState({ audioMuted: data })
        },
        "player.state.update:volume": (data) => {
            this.setState({ audioVolume: data })
        },
        "player.state.update:loading": (data) => {
            this.setState({ loading: data })
        },
    }

    titleRef = React.createRef()

    startSync() {
        // create a interval to get state from player
        if (this.syncInterval) {
            clearInterval(this.syncInterval)
        }

        this.syncInterval = setInterval(() => {
            const time = app.cores.player.seek()
            const duration = app.cores.player.duration()

            this.setState({
                currentDuration: duration,
                currentTime: time,
                colorAnalysis: app.cores.player.state.track_manifest?.metadata.cover_analysis,
            })

            const titleOverflown = isOverflown(this.titleRef.current)

            this.setState({ titleOverflown: titleOverflown })
        }, 800)
    }

    onClickPreviousButton = () => {
        app.cores.player.playback.previous()
    }

    onClickNextButton = () => {
        app.cores.player.playback.next()
    }

    onClicktogglePlayButton = () => {
        if (this.state?.playbackStatus === "playing") {
            app.cores.player.playback.pause()
        } else {
            app.cores.player.playback.play()
        }
    }

    updateVolume = (value) => {
        app.cores.player.volume(value)
    }

    toggleMute = () => {
        app.cores.player.toggleMute()
    }

    componentDidMount() {
        for (const event in this.events) {
            app.eventBus.on(event, this.events[event])
        }

        if (this.syncInterval) {
            clearInterval(this.syncInterval)
        }

        this.startSync()
    }

    componentWillUnmount() {
        for (const event in this.events) {
            app.eventBus.off(event, this.events[event])
        }

        if (this.syncInterval) {
            clearInterval(this.syncInterval)
        }
    }

    onDragEnd = (seekTime) => {
        this.setState({
            currentDragWidth: 0,
            dragging: false,
        })

        app.cores.player.seek(seekTime)
    }

    render() {
        //const bgColor = RGBStringToValues(getComputedStyle(document.documentElement).getPropertyValue("--background-color-accent-values"))

        return <div className="player_controller_wrapper">
            <div
                className={classnames(
                    "player_controller",
                )}
            >
                <div className="player_controller_cover">
                    <Image
                        src={this.state.currentPlaying?.cover ?? this.state.currentPlaying?.thumbnail ?? "/assets/no_song.png"}
                    />
                </div>

                <div className="player_controller_left">
                    <div className="player_controller_info">
                        <div className="player_controller_info_title">
                            {
                                <h4
                                    ref={this.titleRef}
                                    className={classnames(
                                        "player_controller_info_title_text",
                                        {
                                            ["overflown"]: this.state.titleOverflown,
                                        }
                                    )}
                                >
                                    {
                                        this.state.plabackState === "stopped" ? "Nothing is playing" : <>
                                            {this.state.currentPlaying?.title ?? "Nothing is playing"}
                                        </>
                                    }
                                </h4>
                            }

                            {this.state.titleOverflown &&
                                <Marquee
                                    //gradient
                                    //gradientColor={bgColor}
                                    //gradientWidth={20}
                                    play={this.state.plabackState !== "stopped"}
                                >
                                    <h4>
                                        {
                                            this.state.plabackState === "stopped" ? "Nothing is playing" : <>
                                                {this.state.currentPlaying?.title ?? "Nothing is playing"}
                                            </>
                                        }
                                    </h4>
                                </Marquee>}
                        </div>
                        <div className="player_controller_info_artist">
                            {
                                this.state.currentPlaying?.artist && <>
                                    <h3>
                                        {this.state.currentPlaying?.artist ?? "Unknown"}
                                    </h3>
                                    {
                                        this.state.currentPlaying?.album && <>
                                            <span> - </span>
                                            <h3>
                                                {this.state.currentPlaying?.album ?? "Unknown"}
                                            </h3>
                                        </>
                                    }
                                </>
                            }
                        </div>
                    </div>

                    <Controls
                        className="player_controller_controls"
                        controls={{
                            previous: this.onClickPreviousButton,
                            toggle: this.onClicktogglePlayButton,
                            next: this.onClickNextButton,
                        }}
                        syncModeLocked={this.state.syncModeLocked}
                        playbackStatus={this.state.playbackStatus}
                        loading={this.state.loading}
                        audioVolume={this.state.audioVolume}
                        audioMuted={this.state.audioMuted}
                        onVolumeUpdate={this.updateVolume}
                        onMuteUpdate={this.toggleMute}
                    />
                </div>

                <div className="player_controller_progress_wrapper">
                    <div
                        className="player_controller_progress"
                        onMouseDown={(e) => {
                            this.setState({
                                dragging: true,
                            })
                        }}
                        onMouseUp={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const seekTime = this.state.currentDuration * (e.clientX - rect.left) / rect.width

                            this.onDragEnd(seekTime)
                        }}
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const atWidth = (e.clientX - rect.left) / rect.width * 100

                            this.setState({ currentDragWidth: atWidth })
                        }}
                    >
                        <div className="player_controller_progress_bar"
                            style={{
                                width: `${this.state.dragging ? this.state.currentDragWidth : this.state.currentTime / this.state.currentDuration * 100}%`
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    }
}

export default (props) => {
    return <WithPlayerContext>
        <SyncLyrics
            {...props}
        />
    </WithPlayerContext>
}

class SyncLyrics extends React.Component {
    static contextType = Context

    state = {
        loading: true,
        notAvailable: false,

        currentManifest: null,
        currentStatus: null,

        canvas_url: null,
        lyrics: null,
        currentLine: null,

        colorAnalysis: null,

        classnames: {
            "cinematic-mode": false,
            "centered-player": false,
            "video-canvas-enabled": false,
        }
    }

    visualizerRef = React.createRef()

    videoCanvasRef = React.createRef()

    coverCanvasRef = React.createRef()

    events = {
        "player.state.update:track_manifest": (currentManifest) => {
            this.setState({ currentManifest })

            if (document.startViewTransition) {
                document.startViewTransition(this.loadLyrics)
            } else {
                this.loadLyrics()
            }
        },
        "player.state.update:playback_status": (currentStatus) => {
            this.setState({ currentStatus })
        }
    }

    toggleClassName = (className, to) => {
        if (typeof to === "undefined") {
            to = !this.state.classnames[className]
        }

        if (to) {
            if (this.state.classnames[className] === true) {
                return false
            }

            //app.message.info("Toogling on " + className)

            this.setState({
                classnames: {
                    ...this.state.classnames,
                    [className]: true
                },
            })

            return true
        } else {
            if (this.state.classnames[className] === false) {
                return false
            }

            //app.message.info("Toogling off " + className)

            this.setState({
                classnames: {
                    ...this.state.classnames,
                    [className]: false
                },
            })

            return true
        }
    }

    toggleVideoCanvas = (to) => {
        return this.toggleClassName("video-canvas-enabled", to)
    }

    toggleCenteredControllerMode = (to) => {
        return this.toggleClassName("centered-player", to)
    }

    toggleCinematicMode = (to) => {
        return this.toggleClassName("cinematic-mode", to)
    }

    isCurrentLine = (line) => {
        if (!this.state.currentLine) {
            return false
        }

        return this.state.currentLine.startTimeMs === line.startTimeMs
    }

    loadLyrics = async () => {
        if (this.syncInterval) {
            clearInterval(this.syncInterval)
        }

        if (!this.context.track_manifest) {
            return false
        }

        this.setState({
            loading: true,
            notAvailable: false,
            lyrics: null,
            currentLine: null,
            canvas_url: null,
        })

        const api = app.cores.api.instance().instances.music

        let response = await request({
            instance: api,
            method: "get",
            url: `/lyrics/${this.state.currentManifest._id}`,
        }).catch((err) => {
            console.error(err)

            this.setState({
                notAvailable: true,
            })

            return {}
        })

        let data = response.data ?? {
            lines: [],
            syncType: null,
        }

        console.log(this.state.currentManifest)
        console.log(data)

        if (data.lines.length > 0 && data.syncType === "LINE_SYNCED") {
            data.lines = data.lines.map((line, index) => {
                const ref = React.createRef()

                line.ref = ref

                line.startTimeMs = Number(line.startTimeMs)

                const nextLine = data.lines[index + 1]

                // calculate end time
                line.endTimeMs = nextLine ? Number(nextLine.startTimeMs) : Math.floor(app.cores.player.duration() * 1000)

                return line
            })
        }

        if (data.canvas_url) {
            //app.message.info("Video canvas loaded")
            console.log(`[SyncLyrics] Video canvas loaded`)

            this.toggleVideoCanvas(true)
        } else {
            //app.message.info("No video canvas available for this song")
            console.log(`[SyncLyrics] No video canvas available for this song`)

            this.toggleVideoCanvas(false)
        }

        // if has no lyrics or are unsynced, toggle cinematic mode off and center controller
        if (data.lines.length === 0 || data.syncType !== "LINE_SYNCED") {
            //app.message.info("No lyrics available for this song")

            console.log(`[SyncLyrics] No lyrics available for this song, sync type [${data.syncType}]`)

            this.toggleCinematicMode(false)
            this.toggleCenteredControllerMode(true)
        } else {
            //app.message.info("Lyrics loaded, starting sync...")
            console.log(`[SyncLyrics] Starting sync with type [${data.syncType}]`)

            this.toggleCenteredControllerMode(false)
            this.startLyricsSync()
        }

        // transform times
        this.setState({
            loading: false,
            syncType: data.syncType,
            canvas_url: data.canvas_url ?? null,
            lyrics: data.lines,
        })
    }

    startLyricsSync = () => {
        // create interval to sync lyrics
        if (this.syncInterval) {
            clearInterval(this.syncInterval)
        }

        // scroll to top
        this.visualizerRef.current.scrollTop = 0

        this.syncInterval = setInterval(() => {
            if (!this.state.lyrics || !Array.isArray(this.state.lyrics) || this.state.lyrics.length === 0 || !this.state.lyrics[0]) {
                console.warn(`Clearing interval because lyrics is not found or lyrics is empty, probably because memory leak or unmounted component`)
                clearInterval(this.syncInterval)
                return false
            }

            const time = app.cores.player.seek()

            // transform audio seek time to lyrics time (ms from start) // remove decimals
            const transformedTime = Math.floor(time * 1000)

            const hasStartedFirst = transformedTime >= this.state.lyrics[0].startTimeMs

            if (!hasStartedFirst) {
                if (this.state.canvas_url) {
                    this.toggleCinematicMode(true)
                }

                return false
            }

            // find the closest line to the transformed time
            const line = this.state.lyrics.find((line) => {
                // match the closest line to the transformed time
                return transformedTime >= line.startTimeMs && transformedTime <= line.endTimeMs
            })

            if (!line || !line.ref) {
                console.warn(`Clearing interval because cannot find line to sync or line REF is not found, probably because memory leak or unmounted component`)
                clearInterval(this.syncInterval)

                return false
            }

            if (line) {
                if (this.isCurrentLine(line)) {
                    return false
                }

                // set current line
                this.setState({
                    currentLine: line,
                })

                //console.log(line)

                if (!line.ref.current) {
                    console.log(line)
                    console.warn(`Clearing interval because line CURRENT ref is not found, probably because memory leak or unmounted component`)
                    clearInterval(this.syncInterval)

                    return false
                }

                this.visualizerRef.current.scrollTo({
                    top: line.ref.current.offsetTop - (this.visualizerRef.current.offsetHeight / 2),
                    behavior: "smooth",
                })

                if (this.state.canvas_url) {
                    if (line.words === "♪" || line.words === "♫" || line.words === " " || line.words === "") {
                        //console.log(`[SyncLyrics] Toogling cinematic mode on because line is empty`)

                        this.toggleCinematicMode(true)
                    } else {
                        //console.log(`[SyncLyrics] Toogling cinematic mode off because line is not empty`)

                        this.toggleCinematicMode(false)
                    }
                } else {
                    if (this.state.classnames["cinematic-mode"] === true) {
                        this.toggleCinematicMode(false)
                    }
                }
            }
        }, 100)
    }

    componentDidMount = async () => {
        // register player events 
        for (const [event, callback] of Object.entries(this.events)) {
            app.eventBus.on(event, callback)
        }

        // get current playback status and time
        const {
            track_manifest,
            playback_status,
        } = app.cores.player.state

        await this.setState({
            currentManifest: track_manifest,
            currentStatus: playback_status,
            colorAnalysis: track_manifest.cover_analysis,
        })

        if (app.layout.sidebar) {
            app.controls.toggleUIVisibility(false)
        }

        app.layout.toggleCenteredContent(false)

        app.cores.style.compactMode(true)
        app.cores.style.applyVariant("dark")

        // request full screen to browser
        if (document.fullscreenEnabled) {
            document.documentElement.requestFullscreen()
        }

        // listen when user exit full screen to exit cinematic mode
        document.addEventListener("fullscreenchange", () => {
            if (!document.fullscreenElement) {
                app.location.back()
            }
        })

        window._hacks = {
            toggleVideoCanvas: this.toggleVideoCanvas,
            toggleCinematicMode: this.toggleCinematicMode,
            toggleCenteredControllerMode: this.toggleCenteredControllerMode,
        }

        await this.loadLyrics()
    }

    componentWillUnmount() {
        // unregister player events
        for (const [event, callback] of Object.entries(this.events)) {
            app.eventBus.off(event, callback)
        }

        // clear sync interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval)
        }

        delete window._hacks

        if (app.layout.sidebar) {
            app.controls.toggleUIVisibility(true)
        }

        app.cores.style.compactMode(false)
        app.cores.style.applyInitialVariant()

        // exit full screen
        if (document.fullscreenEnabled) {
            document.exitFullscreen()
        }
    }

    renderLines() {
        if (!this.state.lyrics || this.state.notAvailable || this.state.syncType !== "LINE_SYNCED") {
            return null
        }

        return this.state.lyrics.map((line, index) => {
            return <div
                ref={line.ref}
                className={classnames(
                    "lyrics_viewer_lines_line",
                    {
                        ["current"]: this.isCurrentLine(line)
                    }
                )}
                id={line.startTimeMs}
                key={index}
            >
                <h2>
                    {line.words}
                </h2>
            </div>
        })
    }

    render() {
        return <div
            ref={this.visualizerRef}
            className={classnames(
                "lyrics_viewer",
                {
                    ["text_dark"]: this.state.colorAnalysis?.isDark ?? false,
                    ...Object.entries(this.state.classnames).reduce((acc, [key, value]) => {
                        return {
                            ...acc,
                            [key]: value,
                        }
                    }, {}),
                },
            )}
            style={{
                "--predominant-color": this.state.colorAnalysis?.hex ?? "unset",
                "--predominant-color-rgb-values": this.state.colorAnalysis?.value ? composeRgbValues(this.state.colorAnalysis?.value) : [0, 0, 0],
                "--line-time": `${calculateLineTime(this.state.currentLine)}ms`,
                "--line-animation-play-state": this.state.currentStatus === "playing" ? "running" : "paused",
            }}
        >

            <div
                className="lyrics_viewer_mask"
            />

            <div
                className="lyrics_viewer_video_canvas"
            >
                <video
                    src={this.state.canvas_url}
                    autoPlay
                    loop
                    muted
                    controls={false}
                    ref={this.videoCanvasRef}
                />
            </div>

            <div
                className="lyrics_viewer_cover"
            >
                <Image
                    src={this.state.currentManifest?.cover ?? this.state.currentManifest?.thumbnail ?? "/assets/no_song.png"}
                    ref={this.coverRef}
                />
            </div>

            <PlayerController />

            <div className="lyrics_viewer_content">
                <div className="lyrics_viewer_lines">
                    {
                        this.renderLines()
                    }
                </div>
            </div>
        </div>
    }
}