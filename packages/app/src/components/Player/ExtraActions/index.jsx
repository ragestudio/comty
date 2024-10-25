import React from "react"
import { Button } from "antd"

import { Icons } from "@components/Icons"
import LikeButton from "@components/LikeButton"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

const ExtraActions = (props) => {
    const playerState = usePlayerStateContext()

    const handleClickLike = async () => {
        await app.cores.player.toggleCurrentTrackLike(!playerState.track_manifest?.liked)
    }

    return <div className="extra_actions">
        {
            app.isMobile && <Button
                type="ghost"
                icon={<Icons.MdAbc />}
                disabled={!playerState.track_manifest?.lyrics_enabled}
            />
        }
        {
            !app.isMobile && <LikeButton
                liked={playerState.track_manifest?.liked ?? false}
                onClick={handleClickLike}
            />
        }

        <Button
            type="ghost"
            icon={<Icons.MdQueueMusic />}
        />
    </div>
}

export default ExtraActions