
import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import Livestream from "models/livestream"
import { UserPreview, LiveChat } from "components"
import { Icons } from "components/Icons"
import Ticker from "react-ticker"

import Plyr from "plyr"
import Hls from "hls.js"
import mpegts from "mpegts.js"

import "plyr/dist/plyr.css"
import "./index.less"

export default class StreamViewer extends React.Component {
    state = {
        requestedUsername: null,

        isEnded: false,
        loading: true,
        cinemaMode: false,

        streamSources: null,
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
        flv: async (source) => {
            if (!source) {
                console.error("Stream source is not defined")
                return false
            }

            this.toggleLoading(true)

            const decoderInstance = mpegts.createPlayer({
                type: "flv",
                isLive: true,
                enableWorker: true,
                url: source
            })

            decoderInstance.on(mpegts.Events.ERROR, this.onSourceEnd)

            decoderInstance.attachMediaElement(this.videoPlayerRef.current)
            decoderInstance.load()

            await decoderInstance.play()

            this.toggleLoading(false)

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

    onSourceEnd = () => {
        if (typeof this.state.decoderInstance?.destroy === "function") {
            this.state.decoderInstance.destroy()
        }

        this.state.player.destroy()

        this.setState({
            isEnded: true,
            loading: false,
            cinemaMode: false,
        })
    }

    loadStreamInfo = async (username) => {
        const streamInfo = await Livestream.getStreamInfo({ username }).catch((error) => {
            console.error(error)

            return null
        })

        if (!streamInfo) {
            return false
        }

        console.log("Stream info", streamInfo)

        this.setState({
            streamInfo: streamInfo,
        })
    }

    loadStreamSources = async (username) => {
        const streamSources = await Livestream.getLivestream({ username }).catch((error) => {
            console.error(error)

            this.onSourceEnd(error)

            return null
        })

        if (!streamSources) {
            return false
        }

        console.log("Stream sources", streamSources)

        this.setState({
            streamSources: streamSources,
            spectators: streamSources.connectedClients,
        })
    }

    attachPlayer = () => {
        const player = new Plyr("#player", {
            clickToPlay: false,
            autoplay: true,
            controls: ["mute", "volume", "fullscreen", "airplay", "options", "settings",],
            settings: ["quality"],
            ...this.state.plyrOptions,
        })

        // insert a button to enter to cinema mode
        player.elements.buttons.fullscreen.insertAdjacentHTML("beforeBegin", `
            <button class="plyr__controls__item plyr__control" type="button" data-plyr="cinema">
                <span class="label">Cinema mode</span>
            </button>
        `)

        player.elements.buttons.cinema = player.elements.container.querySelector("[data-plyr='cinema']")

        player.elements.buttons.cinema.addEventListener("click", () => this.toggleCinemaMode())

        this.setState({
            player,
        })
    }

    componentDidMount = async () => {
        this.enterPlayerAnimation()

        const requestedUsername = this.props.params.key

        await this.setState({
            requestedUsername,
        })

        this.attachPlayer()

        // get stream info
        this.loadStreamInfo(requestedUsername)
        await this.loadStreamSources(requestedUsername)

        if (this.state.streamSources) {
            if (!this.state.streamSources.sources) {
                console.error("Stream sources is not defined")

                return false
            }

            await this.loadDecoder("flv", this.state.streamSources.sources.flv)
        }

        // TODO: Watch ws to get livestream:started event and load the decoder if it's not loaded

        // set a interval to update the stream info
        this.streamInfoInterval = setInterval(() => {
            this.loadStreamSources(requestedUsername)
        }, 1000 * 60)
    }

    componentWillUnmount = () => {
        this.exitPlayerAnimation()

        if (this.streamInfoInterval) {
            clearInterval(this.streamInfoInterval)
        }
    }

    enterPlayerAnimation = () => {
        // make the interface a bit confortable for a video player
        app.cores.style.applyVariant("dark")

        app.cores.style.compactMode(true)
    }

    exitPlayerAnimation = () => {
        app.style.applyVariant(app.cores.settings.get("themeVariant"))

        app.cores.style.compactMode(false)
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

        console.log(`Switching decoder to: ${decoder}`)

        const decoderInstance = await this.attachDecoder[decoder](...args)

        await this.setState({
            decoderInstance: decoderInstance
        })

        return decoderInstance
    }

    toggleLoading = (to) => {
        this.setState({ loading: to ?? !this.state.loading })
    }

    toggleCinemaMode = (to) => {
        if (typeof to === "undefined") {
            to = !this.state.cinemaMode
        }

        app.SidebarController.toggleVisibility(!to)

        this.setState({ cinemaMode: to })
    }

    render() {
        return <div
            className={classnames(
                "livestream",
                {
                    ["cinemaMode"]: this.state.cinemaMode,
                }
            )}
        >
            <div className="livestream_player">
                <div className="livestream_player_header">
                    {
                        this.state.streamInfo
                            ? <>
                                <div className="livestream_player_header_user">
                                    <UserPreview username={this.state.requestedUsername} />

                                    {
                                        !this.state.isEnded && <div className="livestream_player_header_user_spectators">
                                            <antd.Tag
                                                icon={<Icons.Eye />}
                                            >
                                                {this.state.spectators}
                                            </antd.Tag>
                                        </div>
                                    }
                                </div>

                                <div className="livestream_player_header_info">
                                    <div className="livestream_player_header_info_title">
                                        <h1>{this.state.streamInfo?.title}</h1>
                                    </div>
                                    <div className="livestream_player_header_info_description">
                                        <Ticker
                                            mode="smooth"
                                        >
                                            {({ index }) => {
                                                return <h4>{this.state.streamInfo?.description}</h4>
                                            }}
                                        </Ticker>
                                    </div>
                                </div>
                            </>
                            : <antd.Skeleton active />
                    }
                </div>

                <video
                    ref={this.videoPlayerRef}
                    id="player"
                    style={{
                        display: this.state.isEnded ? "none" : "block",
                    }}
                />

                {
                    this.state.isEnded && <antd.Result>
                        <h1>
                            This stream is ended
                        </h1>
                    </antd.Result>
                }

                <div
                    className={classnames(
                        "livestream_player_loading",
                        {
                            ["active"]: this.state.loading,
                        }
                    )}
                >
                    <antd.Spin />
                </div>
            </div>

            <div className="livestream_panel">
                <div className="chatbox">
                    {
                        !this.state.cinemaMode && <div className="chatbox_header">
                            <h4><Icons.MessageCircle /> Live chat</h4>
                        </div>
                    }
                    <LiveChat
                        roomId={`livestream:${this.state.requestedUsername}`}
                        floatingMode={this.state.cinemaMode}
                    />
                </div>
            </div>
        </div>
    }
}