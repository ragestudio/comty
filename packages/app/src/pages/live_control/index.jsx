import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"

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
                <Icons.Eye  />
                Click to show key
            </div>
        }
    </div>
}

export default (props) => {
    const [streamInfo, setStreamInfo] = React.useState(null)

    const [isConnected, setIsConnected] = React.useState(false)
    const [targetServer, setTargetServer] = React.useState("No available server")

    const [streamingKey, setStreamingKey] = React.useState(null)

    const checkStreamingKey = async () => {
        const result = await app.api.withEndpoints("main").get.streamingKey().catch((error) => {
            console.error(error)
            antd.message.error(error.message)

            return null
        })

        if (result) {
            setStreamingKey(result.key)
        }
    }

    const regenerateStreamingKey = async () => {
        antd.Modal.confirm({
            title: "Regenerate streaming key",
            content: "Are you sure you want to regenerate the streaming key? After this, all other generated keys will be deleted.",
            onOk: async () => {
                const result = await app.api.withEndpoints("main").post.regenerateStreamingKey().catch((error) => {
                    console.error(error)
                    antd.message.error(error.message)

                    return null
                })

                if (result) {
                    setStreamingKey(result.key)
                }
            }
        })
    }

    React.useEffect(() => {
        checkStreamingKey()
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
                        {targetServer}
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
                <h2>Additional options</h2>
            </div>
        </div>
    </div>
}