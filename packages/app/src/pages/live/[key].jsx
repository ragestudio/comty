
import React from "react"
import * as antd from "antd"

import Livestream from "models/livestream"
import { FloatingPanel } from "antd-mobile"
import { UserPreview, LiveChat } from "components"
import { Icons } from "components/Icons"
import Ticker from "react-ticker"

import Plyr from "plyr"
import Hls from "hls.js"
import mpegts from "mpegts.js"

import "plyr/dist/plyr.css"
import "./index.less"

const floatingPanelAnchors = [160, 72 + 119, window.innerHeight * 0.8]

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

        this.setState({
            streamInfo: streamInfo,
            spectators: streamInfo.connectedClients,
        })
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

        // set a interval to update the stream info
        this.streamInfoInterval = setInterval(() => {
            this.loadStreamInfo(requestedUsername)
        }, 1000 * 60 * 3)
    }

    componentWillUnmount = () => {
        this.exitPlayerAnimation()

        if (this.streamInfoInterval) {
            clearInterval(this.streamInfoInterval)
        }
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

        return <div className="livestream">
            <div className="livestream_player">
                <div className="livestream_player_header">
                    <div className="livestream_player_header_user">
                        <UserPreview username={this.state.streamInfo?.username} />

                        <div className="livestream_player_header_user_spectators">
                            <antd.Tag
                                icon={<Icons.Eye />}
                            >
                                {this.state.spectators}
                            </antd.Tag>
                        </div>
                    </div>

                    <div className="livestream_player_header_info">
                        <div className="livestream_player_header_info_title">
                            <h1>{this.state.streamInfo?.info.title}</h1>
                        </div>
                        <div className="livestream_player_header_info_description">
                            <Ticker
                                mode="smooth"
                            >
                                {({ index }) => {
                                    return <h4>{this.state.streamInfo?.info.description}</h4>
                                }}
                            </Ticker>
                        </div>
                    </div>
                </div>

                <video ref={this.videoPlayerRef} id="player" />
            </div>

            {
                window.isMobile ?
                    <FloatingPanel anchors={floatingPanelAnchors}>
                        <UserPreview username={this.state.streamInfo?.username} />
                    </FloatingPanel> :
                    <div className="livestream_panel">
                        <div className="chatbox">
                            <div className="chatbox_header">
                                <h4><Icons.MessageCircle /> Live chat</h4>
                            </div>
                            <LiveChat
                                roomId={`livestream/${this.state.streamInfo?.username}`}
                            />
                        </div>
                    </div>
            }
        </div>
    }
}