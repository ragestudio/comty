import React from "react"
import * as antd from "antd"

import Livestream from "../../models/livestream"

import { UserPreview } from "components"
import { Icons } from "components/Icons"

import Plyr from "plyr"
import Hls from "hls.js"
import mpegts from "mpegts.js"

import "plyr/dist/plyr.css"
import "./index.less"

export default class StreamViewer extends React.Component {
    state = {
        isEnded: false,
        sourceLoading: true,

        streamInfo: null,
        spectators: 0,

        player: null,
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
        flv: (source) => {
            if (!source) {
                console.error("Stream source is not defined")
                return false
            }

            const decoderInstance = mpegts.createPlayer({
                type: "flv",
                isLive: true,
                enableWorker: true,
                url: source
            })

            decoderInstance.attachMediaElement(this.videoPlayerRef.current)
            decoderInstance.load()
            decoderInstance.play()

            return decoderInstance
        },
        hls: (source) => {
            if (!source) {
                console.error("Stream source is not defined")
                return false
            }

            const hlsInstance = new Hls({
                autoStartLoad: true,
            })

            hlsInstance.attachMedia(this.videoPlayerRef.current)

            hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
                hlsInstance.loadSource(source)

                hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    console.log(`${data.levels.length} quality levels found`)
                })
            })

            hlsInstance.on(Hls.Events.ERROR, (event, data) => {
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

            return hlsInstance
        }
    }

    loadStreamInfo = async (username) => {
        const streamInfo = await Livestream.getLivestream({ username })

        if (!streamInfo) {
            return false
        }

        console.log("Stream info", streamInfo)

        this.setState({ streamInfo: streamInfo })
    }

    componentDidMount = async () => {
        const requestedUsername = this.props.match.params.key

        // get stream info
        await this.loadStreamInfo(requestedUsername)

        if (this.state.streamInfo) {
            if (!this.state.streamInfo.sources) {
                console.error("Stream sources is not defined")

                return false
            }

            this.enterPlayerAnimation()

            const player = new Plyr("#player", {
                clickToPlay: false,
                autoplay: true,
                controls: ["mute", "volume", "fullscreen", "airplay", "options", "settings",],
                settings: ["quality"],
                ...this.state.plyrOptions,
            })

            await this.setState({
                player,
            })

            await this.loadDecoder("flv", this.state.streamInfo.sources.flv)
        }
    }

    componentWillUnmount = () => {
        this.exitPlayerAnimation()
    }

    enterPlayerAnimation = () => {
        // make the interface a bit confortable for a video player
        app.style.applyVariant("dark")

        app.eventBus.emit("style.compactMode", true)
    }

    exitPlayerAnimation = () => {
        app.style.applyVariant(app.settings.get("themeVariant"))

        app.eventBus.emit("style.compactMode", false)
    }

    updateQuality = (newQuality) => {
        if (this.state.loadedProtocol !== "hls") {
            console.error("Unsupported protocol")
            return false
        }

        this.state.protocolInstance.levels.forEach((level, levelIndex) => {
            if (level.height === newQuality) {
                console.log("Found quality match with " + newQuality)
                this.state.protocolInstance.currentLevel = levelIndex
            }
        })
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

        this.toogleSourceLoading(true)

        console.log(`Switching decoder to: ${decoder}`)

        const decoderInstance = await this.attachDecoder[decoder](...args)

        await this.setState({
            decoderInstance: decoderInstance
        })

        this.toogleSourceLoading(false)

        return decoderInstance
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