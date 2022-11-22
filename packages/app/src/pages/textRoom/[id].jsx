import React from "react"
import { LiveChat } from "components"

import "./index.less"

export default (props) => {
    const roomId = props.match.params.id

    return <div className="textRoom">
        Connecting to room {roomId}

        <LiveChat
            roomId={roomId}
        />
    </div>
}