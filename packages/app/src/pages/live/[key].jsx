import React from "react"
import * as antd from "antd"

import Livestream from "../../models/livestream"

import { UserPreview } from "components"
import { Icons } from "components/Icons"

import Plyr from "plyr"
import Hls from "hls.js"

import "plyr/dist/plyr.css"
import "./index.less"

export default class StreamViewer extends React.Component {
    state = {
        isEnded: false,
        sourceLoading: true,
        endResult: false,

        userData: null,
        streamInfo: null,
        spectators: 0,

        player: null,
        loadedDecoder: "hls",
        decoderInstance: null,
        plyrOptions: {},
    }

    videoPlayerRef = React.createRef()

    playerDecoderEvents = {
        [Hls.Events.FPS_DROP]: (event, data) => {
            console.log("FPS_DROP Detected", data)
        },
    }

    attachDecoder = {
        hls: (source) => {
            if (!source) {
                console.error("Stream source is not defined")
                return false
            }

            this.toogleSourceLoading(true)

            const hlsInstance = new Hls({
                autoStartLoad: true,
            })

            hlsInstance.attachMedia(this.videoPlayerRef.current)

            hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
                hlsInstance.loadSource(source)

                hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    console.log(`${data.levels.length} quality levels found`)

                    this.toogleSourceLoading(false)

                    // try auto play
                    this.videoPlayerRef.current.play()
                })
            })

            hlsInstance.on(Hls.Events.ERROR, function (event, data) {
                console.error(event, data)

                switch (data.details) {
                    case Hls.ErrorDetails.FRAG_LOAD_ERROR: {
                        console.error(`Error loading fragment ${data.frag.url}`)
                        return
                    }
                    default: {
                        return
                    }
                }
            })

            // register player decoder events
            Object.keys(this.playerDecoderEvents).forEach(event => {
                hlsInstance.on(event, this.playerDecoderEvents[event])
            })

            this.setState({ decoderInstance: hlsInstance, loadedDecoder: "hls" })
        }
    }

    loadStreamInfo = async (username) => {
        const streamInfo = await Livestream.getLivestream({ username })

        if (!streamInfo) {
            return false
        }

        this.setState({ streamInfo: streamInfo })
    }

    componentDidMount = async () => {
        const requestedUsername = this.props.match.params.key

        // get stream info
        await this.loadStreamInfo(requestedUsername)

        console.log("Stream info", this.state.streamInfo)

        if (this.state.streamInfo) {
            if (!this.state.streamInfo.sources) {
                return false
            }

            this.enterPlayerAnimation()

            const player = new Plyr("#player", {
                autoplay: true,
                controls: ["play", "mute", "volume", "fullscreen", "options", "settings"],
                ...this.state.plyrOptions,
            })

            await this.setState({
                player,
            })

            await this.loadDecoder("hls", this.state.streamInfo.sources.hls)
        }
    }

    componentWillUnmount = () => {
        this.exitPlayerAnimation()
    }

    enterPlayerAnimation = () => {
        // make the interface a bit confortable for a video player
        app.style.applyVariant("dark")

        app.eventBus.emit("style.compactMode", true)

        app.SidebarController.toggleVisibility(false)
    }

    exitPlayerAnimation = () => {
        app.style.applyVariant(app.settings.get("themeVariant"))

        app.eventBus.emit("style.compactMode", false)

        app.SidebarController.toggleVisibility(true)
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

    loadDecoder = async (decoder, ...args) => {
        if (typeof this.attachDecoder[decoder] === "undefined") {
            console.error("Protocol not supported")
            return false
        }

        // check if decoder is already loaded
        if (this.state.decoderInstance) {
            if (typeof this.state.decoderInstance.destroy === "function") {
                this.state.decoderInstance.destroy()
            }

            this.setState({ decoderInstance: null })
        }

        console.log("Switching to " + decoder)

        return await this.attachDecoder[decoder](...args)
    }

    toogleSourceLoading = (to) => {
        this.setState({ sourceLoading: to ?? !this.state.sourceLoading })
    }

    onSourceEnded = () => {
        console.log("Source ended")

        this.setState({ isEnded: true })
    }

    render() {
        if (!this.state.streamInfo || this.state.isEnded) {
            return <div className="stream_end">
                <antd.Result>
                    <h1>
                        This stream is ended
                    </h1>
                </antd.Result>
            </div>
        }

        return <div className="stream">
            <video ref={this.videoPlayerRef} id="player" />

            <div className="panel">
                <div className="info">
                    <UserPreview username={this.state.streamInfo?.username} />

                    <div id="spectatorCount">
                        <Icons.Eye />
                        {this.state.spectators}
                    </div>
                </div>
                <div className="chatbox">
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