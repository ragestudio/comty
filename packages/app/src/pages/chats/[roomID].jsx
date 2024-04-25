import React from "react"
import LiveChat from "@components/LiveChat"

const RoomChat = (props) => {
    return <LiveChat
        id={props.params["roomID"]}
    />
}

export default RoomChat