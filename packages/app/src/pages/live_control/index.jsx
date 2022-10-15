import React from "react"
import * as antd from "antd"

import { Icons } from "components/Icons"

import Livestream from "../../models/livestream"

import "./index.less"

const StreamingKeyView = (props) => {
    const [streamingKeyVisibility, setStreamingKeyVisibility] = React.useState(false)

    const toogleVisibility = (to) => {
        setStreamingKeyVisibility(to ?? !streamingKeyVisibility)
    }

    return <div className="streamingKeyString">
        {streamingKeyVisibility ?
            <>
                <Icons.EyeOff onClick={() => toogleVisibility()} />
                <code>
                    {props.streamingKey ?? "No streaming key available"}
                </code>
            </> :
            <div
                onClick={() => toogleVisibility()}
            >
                <Icons.Eye />
                Click to show key
            </div>
        }
    </div>
}

export default (props) => {
    const [streamInfo, setStreamInfo] = React.useState({})
    const [addresses, setAddresses] = React.useState({})

    const [isConnected, setIsConnected] = React.useState(false)
    const [streamingKey, setStreamingKey] = React.useState(null)

    const regenerateStreamingKey = async () => {
        antd.Modal.confirm({
            title: "Regenerate streaming key",
            content: "Are you sure you want to regenerate the streaming key? After this, all other generated keys will be deleted.",
            onOk: async () => {
                const result = await Livestream.regenerateStreamingKey().catch((err) => {
                    app.message.error(`Failed to regenerate streaming key`)
                    console.error(err)

                    return null
                })

                if (result) {
                    setStreamingKey(result.key)
                }
            }
        })
    }

    const fetchStreamingKey = async () => {
        const streamingKey = await Livestream.getStreamingKey().catch((err) => {
            console.error(err)
            return false
        })

        if (streamingKey) {
            setStreamingKey(streamingKey.key)
        }
    }

    const fetchAddresses = async () => {
        const addresses = await Livestream.getAddresses().catch((error) => {
            app.message.error(`Failed to fetch addresses`)
            console.error(error)

            return null
        })

        if (addresses) {
            setAddresses(addresses)
        }
    }

    React.useEffect(() => {
        fetchAddresses()
        fetchStreamingKey()
    }, [])

    return <div className="streamingControlPanel">
        <div className="header">
            <div className="preview">
                <img src="/assets/new_file.png" />
            </div>

            <div className="details">
                <div className="status">
                    <antd.Tag
                        color={isConnected ? "Blue" : "Red"}
                        icon={isConnected ? <Icons.MdOutlineVideocam /> : <Icons.MdOutlineVideocamOff />}
                    >
                        {isConnected ? "Connected" : "Disconnected"}
                    </antd.Tag>
                </div>
                <div className="title">
                    <span>
                        Title
                    </span>
                    <h2>
                        {streamInfo?.title ?? "No title"}
                    </h2>
                </div>

                <div className="category">
                    <span>
                        Category
                    </span>
                    <h4>
                        {streamInfo?.category ?? "No category"}
                    </h4>
                </div>
            </div>
        </div>

        <div className="config">
            <div className="panel">
                <h2><Icons.MdSettingsInputAntenna /> Emission</h2>

                <div className="content">
                    <span>Ingestion URL</span>

                    <code>
                        {addresses.ingestURL ?? "No ingest URL available"}
                    </code>
                </div>

                <div className="content">
                    <div className="title">
                        <div>
                            <span>Streaming key </span>
                        </div>
                        <div>
                            <antd.Button onClick={() => regenerateStreamingKey()}>
                                <Icons.RefreshCw />
                                Regenerate
                            </antd.Button>
                        </div>
                    </div>

                    <div className="value">
                        <StreamingKeyView streamingKey={streamingKey} />
                    </div>
                </div>
            </div>

            <div className="panel">
                <h2><Icons.Tool />Additional options</h2>

                <div className="content">
                    <span>Enable DVR</span>

                    <div className="value">
                        <antd.Switch
                            checked={streamInfo?.dvr ?? false}
                            onChange={false}
                        />
                    </div>
                </div>

                <div className="content">
                    <span>Private mode</span>

                    <div className="value">
                        <antd.Switch
                            checked={streamInfo?.private ?? false}
                            onChange={false}
                        />
                    </div>
                </div>
            </div>

            <div className="panel">
                <h2><Icons.Link /> URL Information</h2>

                <div className="content">
                    <span>Live URL</span>

                    <code>
                        {addresses.liveURL ?? "No Live URL available"}
                    </code>
                </div>

                <div className="content">
                    <span>HLS URL</span>

                    <code>
                        {addresses.hlsURL ?? "No HLS URL available"}
                    </code>
                </div>

                <div className="content">
                    <span>FLV URL</span>

                    <code>
                        {addresses.flvURL ?? "No FLV URL available"}
                    </code>
                </div>
            </div>

            <div className="panel">
                <h2><Icons.Activity /> Statistics</h2>

                <div className="content">
                    <antd.Result>
                        <h1>
                            Cannot connect with statistics
                        </h1>
                    </antd.Result>
                </div>
            </div>
        </div>
    </div>
}