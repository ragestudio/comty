import React from "react"
import classnames from "classnames"

import { ImageViewer } from "components"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const [coverHover, setCoverHover] = React.useState(false)
    const { playlist } = props

    const onClick = () => {
        if (typeof props.onClick === "function") {
            return props.onClick(playlist)
        }

        return app.location.push(`/play/${playlist._id}`)
    }

    const onClickPlay = (e) => {
        e.stopPropagation()

        app.cores.player.startPlaylist(playlist.list)
    }

    return <div
        id={playlist._id}
        key={props.key}
        className={classnames(
            "playlistItem",
            {
                "cover-hovering": coverHover
            }
        )}
    >
        <div
            className="playlistItem_cover"
            onMouseEnter={() => setCoverHover(true)}
            onMouseLeave={() => setCoverHover(false)}
            onClick={onClickPlay}
        >
            <div className="playlistItem_cover_mask">
                <Icons.MdPlayArrow />
            </div>

            <ImageViewer
                src={playlist.cover ?? playlist.thumbnail ?? "/assets/no_song.png"}
            />
        </div>

        <div className="playlistItem_info">
            <div className="playlistItem_info_title" onClick={onClick}>
                <h1>{playlist.title}</h1>
            </div>
        </div>
    </div>
}