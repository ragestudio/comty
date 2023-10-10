import React from "react"
import classnames from "classnames"

import { ImageViewer } from "components"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const [coverHover, setCoverHover] = React.useState(false)
    let { playlist } = props

    if (!playlist) {
        return null
    }

    const onClick = () => {
        if (typeof props.onClick === "function") {
            return props.onClick(playlist)
        }

        return app.location.push(`/play/${playlist._id}`)
    }

    const onClickPlay = (e) => {
        e.stopPropagation()

        app.cores.player.start(playlist.list)
    }

    const subtitle = playlist.type === "playlist" ? `By ${playlist.user_id}` : (playlist.description ?? (playlist.publisher && `Release from ${playlist.publisher?.fullName}`))

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

            <div className="playlistItem_info_subtitle">
                <p>
                    {subtitle}
                </p>
            </div>
        </div>

        <div className="playlistItem_bottom">
            <p>
                <Icons.MdLibraryMusic /> {props.length ?? playlist.total_length ?? playlist.list.length}
            </p>

            <p>
                <Icons.MdAlbum />
                {playlist.type ?? "playlist"}
            </p>
        </div>
    </div>
}