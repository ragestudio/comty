import React from "react"
import { Button } from "antd"
import { Icons } from "components/Icons"

import LikeButton from "components/LikeButton"
import { Context } from "contexts/WithPlayerContext"

const ExtraActions = (props) => {
    const ctx = React.useContext(Context)

    const handleClickLike = async () => {
        await app.cores.player.toggleCurrentTrackLike(!ctx.track_manifest?.liked)
    }

    return <div className="extra_actions">
        {
            app.isMobile && <Button
                type="ghost"
                icon={<Icons.MdAbc />}
                disabled={!ctx.track_manifest?.lyricsEnabled}
            />
        }
        {
            !app.isMobile && <LikeButton
                liked={ctx.track_manifest?.liked ?? false}
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