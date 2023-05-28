import React from "react"
import classnames from "classnames"
import { Button } from "antd"

import UseAnimations from "react-useanimations"
import LoadingAnimation from "react-useanimations/lib/loading"
import { Icons } from "components/Icons"

import Image from "components/Image"

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

class PlayerController extends React.Component {
    state = {
        hovering: false,
        colorAnalysis: null,
        currentState: null,
        currentDragWidth: 0,
    }

    events = {
        "player.coverColorAnalysis.update": (colorAnalysis) => {
            this.setState({ colorAnalysis })
        },
        "player.seek.update": (seekTime) => {
            const updatedState = this.state.currentState

            updatedState.time = seekTime

            this.setState({
                currentState: updatedState,
            })
        },
    }

    startSync() {
        // create a interval to get state from player
        if (this.syncInterval) {
            clearInterval(this.syncInterval)
        }

        this.syncInterval = setInterval(() => {
            const currentState = app.cores.player.currentState()

            this.setState({ currentState })
        }, 800)
    }

    onClickPreviousButton = () => {
        app.cores.player.playback.previous()
    }

    onClickNextButton = () => {
        app.cores.player.playback.next()
    }

    onClickTooglePlayButton = () => {
        if (this.state.currentState?.playbackStatus === "playing") {
            app.cores.player.playback.pause()
        } else {
            app.cores.player.playback.play()
        }
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
        return <div className="player_controller_wrapper">
            <div
                onMouseEnter={() => {
                    this.setState({ hovering: true })
                }}
                onMouseLeave={() => {
                    this.setState({ hovering: false })
                }}
                className={classnames(
                    "player_controller",
                    {
                        ["player_controller--hovering"]: this.state.hovering || this.state.dragging,
                    }
                )}
            >
                <div className="player_controller_cover">
                    <Image
                        src={this.state.currentState?.manifest?.thumbnail}
                    />
                </div>

                <div className="player_controller_left">
                    <div className="player_controller_info">
                        <div className="player_controller_info_title">
                            {this.state.currentState?.manifest?.title}
                        </div>
                        <div className="player_controller_info_artist">
                            {this.state.currentState?.manifest?.artist} - {this.state.currentState?.manifest?.album}
                        </div>
                    </div>

                    <div className="player_controller_controls">
                        <Button
                            type="ghost"
                            shape="round"
                            icon={<Icons.ChevronLeft />}
                            onClick={this.onClickPreviousButton}
                            disabled={this.state.currentState?.syncModeLocked}
                        />
                        <Button
                            className="playButton"
                            type="primary"
                            shape="circle"
                            icon={this.state.currentState?.playbackStatus === "playing" ? <Icons.MdPause /> : <Icons.MdPlayArrow />}
                            onClick={this.onClickTooglePlayButton}
                            disabled={this.state.currentState?.syncModeLocked}
                        >
                            {
                                this.state.currentState?.loading && <div className="loadCircle">
                                    <UseAnimations
                                        animation={LoadingAnimation}
                                        size="100%"
                                    />
                                </div>
                            }
                        </Button>
                        <Button
                            type="ghost"
                            shape="round"
                            icon={<Icons.ChevronRight />}
                            onClick={this.onClickNextButton}
                            disabled={this.state.currentState?.syncModeLocked}
                        />
                    </div>
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
                            const seekTime = this.state.currentState?.duration * (e.clientX - rect.left) / rect.width

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
                                width: `${this.state.dragging ? this.state.currentDragWidth : this.state.currentState?.time / this.state.currentState?.duration * 100}%`
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    }
}

export default class SyncLyrics extends React.Component {
    state = {
        loading: true,
        notAvailable: false,

        currentManifest: null,
        currentStatus: null,

        canvas_url: null,
        lyrics: null,
        currentLine: null,

        colorAnalysis: null,

        classnames: [
            {
                name: "cinematic-mode",
                enabled: false,
            },
            {
                name: "centered-player",
                enabled: false,
            },
            {
                name: "video-canvas-enabled",
                enabled: false,
            }
        ]
    }

    visualizerRef = React.createRef()

    videoCanvasRef = React.createRef()

    thumbnailCanvasRef = React.createRef()

    events = {
        "player.current.update": (currentManifest) => {
            this.setState({ currentManifest })

            if (document.startViewTransition) {
                document.startViewTransition(this.loadLyrics)
            } else {
                this.loadLyrics()
            }
        },
        "player.coverColorAnalysis.update": (colorAnalysis) => {
            this.setState({ colorAnalysis })
        },
        "player.status.update": (currentStatus) => {
            this.setState({ currentStatus })
        }
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

        if (!this.state.currentManifest) {
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
            this.toogleVideoCanvas(true)
        } else {
            //app.message.info("No video canvas available for this song")
            this.toogleVideoCanvas(false)
        }

        // if has no lyrics or are unsynced, toogle cinematic mode off and center controller
        if (data.lines.length === 0 || data.syncType !== "LINE_SYNCED") {
            //app.message.info("No lyrics available for this song")

            this.toogleCinematicMode(false)
            this.toogleCenteredControllerMode(true)
        } else {
            //app.message.info("Lyrics loaded, starting sync...")

            this.toogleCenteredControllerMode(false)
            this.startLyricsSync()
        }

        // transform times
        this.setState({
            loading: false,
            syncType: data.syncType,
            canvas_url: data.canvas_url,
            lyrics: data.lines,
        })
    }

    toogleClassName = (className, to) => {
        let currentState = this.state.classnames.find((c) => c.name === className)

        if (!currentState) {
            return false
        }

        if (typeof to === "undefined") {
            to = !currentState?.enabled
        }

        if (to) {
            if (currentState.enabled) {
                return false
            }

            //app.message.info("Toogling on " + className)

            currentState.enabled = true

            this.setState({
                classnames: this.state.classnames,
            })

            return true
        } else {
            if (!currentState.enabled) {
                return false
            }

            //app.message.info("Toogling off " + className)

            currentState.enabled = false

            this.setState({
                classnames: this.state.classnames,
            })

            return true
        }
    }

    toogleVideoCanvas = (to) => {
        return this.toogleClassName("video-canvas-enabled", to)
    }

    toogleCenteredControllerMode = (to) => {
        return this.toogleClassName("centered-player", to)
    }

    toogleCinematicMode = (to) => {
        return this.toogleClassName("cinematic-mode", to)
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

            const { time } = app.cores.player.currentState()

            // transform audio seek time to lyrics time (ms from start) // remove decimals
            const transformedTime = Math.floor(time * 1000)

            const hasStartedFirst = transformedTime >= this.state.lyrics[0].startTimeMs

            if (!hasStartedFirst) {
                if (this.state.canvas_url) {
                    this.toogleCinematicMode(true)
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
                        this.toogleCinematicMode(true)
                    } else {
                        this.toogleCinematicMode(false)
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
            manifest,
            playbackStatus,
            colorAnalysis,
        } = app.cores.player.currentState()

        await this.setState({
            currentManifest: manifest,
            currentStatus: playbackStatus,
            colorAnalysis,
        })

        app.SidebarController.toggleVisibility(false)
        app.cores.style.compactMode(true)
        app.cores.style.applyVariant("dark")
        app.layout.floatingStack.toogleGlobalVisibility(false)

        window._hacks = {
            toogleVideoCanvas: this.toogleVideoCanvas,
            toogleCinematicMode: this.toogleCinematicMode,
            toogleCenteredControllerMode: this.toogleCenteredControllerMode,
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

        app.SidebarController.toggleVisibility(true)
        app.cores.style.compactMode(false)
        app.cores.style.applyInitialVariant()
        app.layout.floatingStack.toogleGlobalVisibility(true)
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
                    ...this.state.classnames.map((classname) => {
                        return {
                            [classname.name]: classname.enabled,
                        }
                    }).reduce((a, b) => {
                        return {
                            ...a,
                            ...b,
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
                className="lyrics_viewer_thumbnail"
            >
                <Image
                    src={this.state.currentManifest?.thumbnail}
                    ref={this.thumbnailRef}
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