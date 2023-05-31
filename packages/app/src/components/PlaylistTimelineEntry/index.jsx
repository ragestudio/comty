import React from "react"
import { Button } from "antd"
import { Icons } from "components/Icons"
import Image from "components/Image"

import "./index.less"

export default (props) => {
    const { data } = props

    const startPlaylist = () => {
        app.cores.player.startPlaylist(data.list, 0)
    }

    const navigateToPlaylist = () => {
        app.setLocation(`/play/${data._id}`)
    }

    return <div className="playlistTimelineEntry">
        <div className="playlistTimelineEntry_content">
            <div className="playlistTimelineEntry_thumbnail">
                <Image
                    src={data.cover ?? data.thumbnail}
                    onClick={navigateToPlaylist}
                />
            </div>

            <div className="playlistTimelineEntry_info">
                <div className="playlistTimelineEntry_title">
                    <h1 onClick={navigateToPlaylist}>
                        <Icons.MdAlbum /> {data.title ?? "Untitled"}
                    </h1>

                    <p>
                        by <a onClick={() => app.navigation.goToAccount(data.user.username)}>@{data.user.username}</a>
                    </p>
                </div>

                <div className="playlistTimelineEntry_statistics">
                    <div className="playlistTimelineEntry_statistic">
                        <Icons.MdFavoriteBorder /> {data.likes ?? 0}
                    </div>

                    <div className="playlistTimelineEntry_statistic">
                        <Icons.MdHeadset /> {data.listenings ?? 0}
                    </div>

                    <div className="playlistTimelineEntry_statistic">
                        <Icons.MdList /> {data.list?.length}
                    </div>
                </div>
            </div>

            <div className="playlistTimelineEntry_actions">
                <div className="playlistTimelineEntry_action">
                    <Button
                        type="primary"
                        size="large"
                        icon={<Icons.Play />}
                        onClick={startPlaylist}
                    />
                </div>
            </div>
        </div>
    </div>
}