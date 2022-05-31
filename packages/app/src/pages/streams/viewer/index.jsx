import React from "react"
import config from "config"
import * as antd from "antd"
import { Icons } from "components/Icons"
import moment from "moment"

import Plyr from "plyr"
import Hls from "hls.js"
import mpegts from "mpegts.js"

import "plyr/dist/plyr.css"
import "./index.less"

const streamsSource = config.remotes.streamingApi

export default class StreamViewer extends React.Component {
    state = {
        isEnded: false,
        isLoading: true,
        endResult: false,

        userData: null,
        streamInfo: null,
        spectators: 0,
        timeFromNow: "00:00:00",

        player: null,
        streamKey: null,
        streamSource: null,
        loadedProtocol: "flv",
        protocolInstance: null,
        plyrOptions: {},
    }

    videoPlayerRef = React.createRef()

    componentDidMount = async () => {
        window.StreamViewer = {
            updateQuality: this.updateQuality,
            switchProtocol: this.switchProtocol,
        }

        const query = new URLSearchParams(window.location.search)
        const requestedUsername = query.get("key")

        const source = `${streamsSource}/${requestedUsername}`
        const player = new Plyr("#player", {
            autoplay: true,
            controls: ["play", "mute", "volume", "fullscreen", "options", "settings"],
            ...this.state.plyrOptions,
        })

        await this.setState({
            player,
            streamKey: requestedUsername,
            streamSource: source,
        })

        await this.loadWithProtocol[this.state.loadedProtocol]()

        // make the interface a bit confortable for a video player
        app.style.applyVariant("dark")

        app.eventBus.emit("toogleCompactMode", true)

        app.SidebarController.toggleVisibility(false)
        app.HeaderController.toggleVisibility(false)

        // fetch user info in the background
        this.gatherUserInfo()

        // fetch stream info in the background
        // await for it
        await this.gatherStreamInfo()

        // // create timer
        // if (this.state.streamInfo.connectCreated) {
        //     this.createTimerCounter()
        // }
    }

    componentWillUnmount = () => {
        app.style.applyVariant(app.settings.get("themeVariant"))

        app.eventBus.emit("toogleCompactMode", false)

        app.SidebarController.toggleVisibility(true)
        app.HeaderController.toggleVisibility(true)

        if (this.timerCounterInterval) {
            this.timerCounterInterval = clearInterval(this.timerCounterInterval)
        }
    }

    gatherStreamInfo = async () => {
        const result = await app.request.get.streamInfoFromUsername(undefined, {
            username: this.state.streamKey,
        }).catch((error) => {
            console.error(error)
            antd.message.error(error.message)
            return false
        })

        if (result) {
            this.setState({
                streamInfo: result,
            })
        }
    }

    gatherUserInfo = async () => {
        const result = await app.request.get.user(undefined, {
            username: this.state.streamKey,
        }).catch((error) => {
            console.error(error)
            antd.message.error(error)
            return false
        })

        if (result) {
            this.setState({
                userData: result,
            })
        }
    }

    createTimerCounter = () => {
        this.timerCounterInterval = setInterval(() => {
            const secondsFromNow = moment().diff(moment(this.state.streamInfo.connectCreated), "seconds")

            // calculate hours minutes and seconds
            const hours = Math.floor(secondsFromNow / 3600)
            const minutes = Math.floor((secondsFromNow - hours * 3600) / 60)
            const seconds = secondsFromNow - hours * 3600 - minutes * 60

            this.setState({
                timeFromNow: `${hours}:${minutes}:${seconds}`,
            })
        }, 1000)
    }

    updateQuality = (newQuality) => {
        if (loadedProtocol === "hls") {
            this.state.protocolInstance.levels.forEach((level, levelIndex) => {
                if (level.height === newQuality) {
                    console.log("Found quality match with " + newQuality)
                    this.state.protocolInstance.currentLevel = levelIndex
                }
            })
        }
        else {
            console.error("Unsupported protocol")
        }
    }

    switchProtocol = (protocol) => {
        if (typeof this.state.protocolInstance.destroy === "function") {
            this.state.protocolInstance.destroy()
        }

        this.setState({ protocolInstance: null })

        console.log("Switching to " + protocol)
        this.loadWithProtocol[protocol]()
    }

    loadWithProtocol = {
        hls: () => {
            const source = `${streamsSource}/media/${this.state.streamKey}/index.m3u8`
            const hls = new Hls()

            hls.loadSource(source)
            hls.attachMedia(this.videoPlayerRef.current)

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                const levels = hls.levels

                const quality = {
                    default: levels[levels.length - 1].height,
                    options: levels.map((level) => level.height),
                    forced: true,
                    onChange: (newQuality) => {
                        console.log('changes', newQuality)

                        levels.forEach((level, levelIndex) => {
                            if (level.height === newQuality) {
                                hls.currentLevel = levelIndex
                            }
                        })

                    },
                }

                this.setState({
                    plyrOptions: {
                        quality,
                        ...this.state.plyrOptions
                    }
                })
            })

            this.setState({ protocolInstance: hls, loadedProtocol: "hls" })
        },
        flv: () => {
            const source = `${streamsSource}/stream/flv/${this.state.streamKey}`

            const instance = mpegts.createPlayer({
                enableWorker: true,
                type: "flv",
                url: source,
                cors: true,
                isLive: true
            })

            instance.attachMediaElement(this.videoPlayerRef.current)
            instance.load()
            instance.play()

            instance.on("error", (error) => {
                console.error(error)
                antd.message.error(error.toString())

                //this.onSourceEnded(error)
            })

            // instance.on("onSourceOpen", this.onSourceLoading)
            // instance.on(mpegts.Events["LOADING_COMPLETE"], this.onSourceLoadingDone)
            // instance.on("onSourceEnded", this.onSourceEnded)

            this.setState({ protocolInstance: instance, loadedProtocol: "flv" })
        },
    }

    onSourceLoading = () => {
        this.setState({
            isLoading: true,
        })
    }

    onSourceLoadingDone = () => {
        console.log(`loaded ${this.state.loadedProtocol}`)
        this.setState({
            isLoading: false,
        })
    }

    onSourceEnded = () => {
        console.log("Source ended")
        this.setState({ isEnded: true })
    }

    render() {
        return <div className="stream">
            {
                this.state.isEnded && <div className="stream_end">
                    <antd.Result>
                        <h1>
                            This stream is ended
                        </h1>
                    </antd.Result>
                </div>
            }
            <video ref={this.videoPlayerRef} id="player" />
            <div className="panel">
                <div className="info">
                    <div className="title">
                        <div>
                            <antd.Avatar
                                shape="square"
                                src={this.state.userData?.avatar}
                            />
                        </div>
                        <div>
                            <h2>{this.state.userData?.username}</h2>
                        </div>
                    </div>
                    <div id="spectatorCount">
                        <Icons.Eye />
                        {this.state.spectators}
                    </div>
                </div>
                <div className="chatbox">
                    {/* TODO: Use chatbox component and join to stream channel using username */}
                    <antd.Result>
                        <h1>
                            Cannot connect with chat server
                        </h1>
                    </antd.Result>
                </div>
            </div>
        </div>
    }
}