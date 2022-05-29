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
                <h4>
                    {props.streamingKey ?? "No streaming key available"}
                </h4>
            </> :
            <>
                <Icons.Eye onClick={() => toogleVisibility()} />
                Show key
            </>
        }
    </div>
}

export default (props) => {
    const [isConnected, setIsConnected] = React.useState(false)
    const [targetServer, setTargetServer] = React.useState("No available server")

    const [streamingKey, setStreamingKey] = React.useState(null)
    const [serverTier, setServerTier] = React.useState(null)

    const checkStreamingKey = async () => {
        const result = await app.request.get.streamingKey().catch((error) => {
            console.error(error)
            antd.message.error(error.message)

            return null
        })

        if (result) {
            setStreamingKey(result.key)
        }
    }

    const checkTagetServer = async () => {
        const result = await app.request.get.targetStreamingServer()

        if (result) {
            const targetServer = `${result.protocol}://${result.address}:${result.port}/${result.space}`
            setTargetServer(targetServer)
        }
    }

    const regenerateStreamingKey = async () => {
        antd.Modal.confirm({
            title: "Regenerate streaming key",
            content: "Are you sure you want to regenerate the streaming key? After this, all other generated keys will be deleted.",
            onOk: async () => {
                const result = await app.request.post.regenerateStreamingKey().catch((error) => {
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
        checkTagetServer()
        // TODO: Use UserTier controller to check streaming service tier
        // by now, we just use a fixed value
        setServerTier("basic")
    }, [])

    return <div className="streamingControlPanel">
        <div>
            <h2><Icons.MdSettingsInputAntenna /> Connection Status</h2>

            <div>
                <antd.Tag
                    color={isConnected ? "Blue" : "Red"}
                    icon={isConnected ? <Icons.MdOutlineVideocam /> : <Icons.MdOutlineVideocamOff />}
                >
                    {isConnected ? "Connected" : "Disconnected"}
                </antd.Tag>
            </div>
        </div>

        <div>
            <h2><Icons.MdInfoOutline /> Stream information</h2>

            <div className="info">
                <div className="label">
                    <Icons.Tag />
                    Title
                </div>
                <div className="value">
                    <antd.Input
                        placeholder="Stream Title"
                        disabled
                    />
                </div>
            </div>
            
            <div className="info">
                <div className="label">
                    <Icons.Grid />
                    Category
                </div>

                <div className="value">
                    <antd.Select
                        disabled
                    >

                    </antd.Select>
                </div>
            </div>
        </div>

        <div>
            <h2><Icons.Info /> Server info</h2>

            <div className="info">
                <div className="label">
                    <Icons.Server />
                    Server Address
                </div>
                <div className="value">
                    <h4>
                        {targetServer}
                    </h4>
                </div>
            </div>

            <div className="info">
                <div className="label">
                    <Icons.Key />
                    Streaming Key
                </div>
                <div className="value">
                    <StreamingKeyView streamingKey={streamingKey} />
                </div>
                <div>
                    <antd.Button onClick={() => regenerateStreamingKey()}>
                        <Icons.RefreshCw />
                        Regenerate
                    </antd.Button>
                </div>
            </div>

            <div className="info">
                <div className="label">
                    <Icons.MdSettingsInputSvideo />
                    Usage Tier
                </div>
                <div className="value">
                    <antd.Tag>
                        {serverTier}
                    </antd.Tag>
                </div>
            </div>
        </div>
    </div>
}