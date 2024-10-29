import React from "react"
import { Button } from "antd"

import { Icons } from "@components/Icons"
import LikeButton from "@components/LikeButton"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

import MusicModel from "@models/music"

const ExtraActions = (props) => {
    const [playerState] = usePlayerStateContext()
    const handleClickLike = async () => {
        await MusicModel.toggleItemFavourite("track", playerState.track_manifest._id)
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
                liked={playerState.track_manifest?.fetchLikeStatus}
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