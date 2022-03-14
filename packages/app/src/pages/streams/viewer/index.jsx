import React from 'react'
import * as antd from "antd"
import Plyr from 'plyr'
import Hls from 'hls.js'
import mpegts from 'mpegts.js'

import "plyr/dist/plyr.css"

const streamsSource = "http://media.ragestudio.net/live"

export default class StreamViewer extends React.Component {
    state = {
        player: null,
        streamKey: null,
        streamSource: null,
        loadedProtocol: "flv",
        protocolInstance: null,
        defaultOptions: undefined,
    }

    videoPlayerRef = React.createRef()

    componentDidMount = async () => {
        const query = new URLSearchParams(window.location.search)
        const requested = query.get("key")

        const source = `${streamsSource}/${requested}`
        const player = new Plyr('#player')

        await this.setState({
            player,
            streamKey: requested,
            streamSource: source,
        })

        await this.loadWithProtocol[this.state.loadedProtocol]()
    }

    updateQuality = (newQuality) => {
        if (loadedProtocol === "hls") {
            this.state.protocolInstance.levels.forEach((level, levelIndex) => {
                if (level.height === newQuality) {
                    console.log("Found quality match with " + newQuality);
                    this.state.protocolInstance.currentLevel = levelIndex;
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
            const source = `${this.state.streamSource}.m3u8`
            const hls = new Hls()

            hls.loadSource(source)
            hls.attachMedia(this.videoPlayerRef.current)

            this.setState({ protocolInstance: hls, loadedProtocol: "hls" })
        },
        flv: () => {
            const source = `${this.state.streamSource}.flv`

            const instance = mpegts.createPlayer({ type: 'flv', url: source, isLive: true })

            instance.attachMediaElement(this.videoPlayerRef.current)
            instance.load()
            instance.play()

            this.setState({ protocolInstance: instance, loadedProtocol: "flv" })
        },
    }

    render() {
        return <div>
            <antd.Select
                onChange={(value) => this.switchProtocol(value)}
                value={this.state.loadedProtocol}
            >
                <antd.Select.Option value="hls">HLS</antd.Select.Option>
                <antd.Select.Option value="flv">FLV</antd.Select.Option>
            </antd.Select>
            <video ref={this.videoPlayerRef} id="player" />
        </div>
    }
}