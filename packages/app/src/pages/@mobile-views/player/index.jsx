import React from "react"
import MediaPlayer from "components/Player/MediaPlayer"

import "./index.less"

export default () => {
    return <div className="__mobile-player-view">
        <MediaPlayer
            frame={false}
        />
    </div>
}