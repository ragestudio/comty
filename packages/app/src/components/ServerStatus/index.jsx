import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"

export default () => {
    const [connected, setConnected] = React.useState(window.app.ws.mainSocketConnected ?? false)

    window.app.eventBus.on("websocket_connected", (status) => {
        setConnected(true)
    })

    window.app.eventBus.on("websocket_disconnected", (status) => {
        setConnected(false)
    })

    const getColor = () => {
        if (!connected) {
            return "red"
        }

        return "blue"
    }

    return <div>
        <div key="health">
            <Icons.Activity /> <antd.Tag color={getColor()}>
                {connected ? "Connected" : "Disconnected"}
            </antd.Tag>
        </div>
    </div>
}