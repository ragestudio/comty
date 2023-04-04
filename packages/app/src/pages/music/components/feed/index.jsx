import React from "react"
import * as antd from "antd"
import { ImageViewer, UserPreview } from "components"
import { Icons } from "components/Icons"
import { Translation } from "react-i18next"

import FeedModel from "models/feed"

import "./index.less"

const PlaylistItem = (props) => {
    const { playlist } = props

    const onClick = () => {
        if (typeof props.onClick === "function") {
            return props.onClick(playlist)
        }

        return app.setLocation(`/play/${playlist._id}`)
    }

    const onClickPlay = (e) => {
        e.stopPropagation()

        console.log(playlist.list)

        app.cores.player.startPlaylist(playlist.list)
    }

    return <div
        id={playlist._id}
        key={props.key}
        className="playlistItem"
        onClick={onClick}
    >
        <div className="playlistItem_cover">
            <ImageViewer src={playlist.thumbnail ?? "/assets/no_song.png"} />
        </div>
        <div className="playlistItem_info">
            <div className="playlistItem_info_title">
                <h1>{playlist.title}</h1>
            </div>
            <UserPreview user={playlist.user} />
        </div>
        <div className="playlistItem_actions">
            <antd.Button
                icon={<Icons.Play />}
                type="primary"
                shape="circle"
                onClick={onClickPlay}
            />
        </div>
    </div>
}

const RecentlyPlayed = (props) => {
    return <div className="playlistExplorer_section">
        <div className="playlistExplorer_section_header">
            <h1>
                <Icons.MdReplay />
                <Translation>
                    {(t) => t("Recently Played")}
                </Translation>
            </h1>
        </div>

        <div>
            <antd.Result
                status="warning"
                title="Failed to load"
                subTitle="We are sorry, but we could not load your playlists. Please try again later."
            />
        </div>
    </div>
}

const FollowingArtists = (props) => {
    const [L_MusicFeed, R_MusicFeed, E_MusicFeed] = app.cores.api.useRequest(FeedModel.getPlaylistsFeed)

    if (E_MusicFeed) {
        console.error(E_MusicFeed)

        return <div className="playlistExplorer_section">
            <antd.Result
                status="warning"
                title="Failed to load"
                subTitle="We are sorry, but we could not load your playlists. Please try again later."
            />
        </div>
    }

    return <div className="playlistExplorer_section">
        <div className="playlistExplorer_section_header">
            <h1>
                <Icons.MdPerson />
                <Translation>
                    {(t) => t("From following artists")}
                </Translation>
            </h1>
        </div>
        <div className="playlistExplorer_section_list">
            {
                L_MusicFeed && <antd.Skeleton active />
            }
            {
                !L_MusicFeed && R_MusicFeed.map((playlist, index) => {
                    return <PlaylistItem
                        key={index}
                        playlist={playlist}
                    />
                })
            }
        </div>
    </div>
}

const PlaylistExplorer = (props) => {
    const [L_MusicFeed, R_MusicFeed, E_MusicFeed] = app.cores.api.useRequest(FeedModel.getGlobalMusicFeed)

    if (E_MusicFeed) {
        console.error(E_MusicFeed)

        return <div className="playlistExplorer_section">
            <antd.Result
                status="warning"
                title="Failed to load"
                subTitle="We are sorry, but we could not load your playlists. Please try again later."
            />
        </div>
    }

    return <div className="playlistExplorer_section">
        <div className="playlistExplorer_section_header">
            <h1>
                <Icons.MdExplore />
                <Translation>
                    {(t) => t("Explore from global")}
                </Translation>
            </h1>
        </div>

        <div className="playlistExplorer_section_list">
            {
                L_MusicFeed && <antd.Skeleton active />
            }
            {
                !L_MusicFeed && R_MusicFeed.map((playlist, index) => {
                    return <PlaylistItem
                        key={index}
                        playlist={playlist}
                    />
                })
            }
        </div>
    </div>
}

const MayLike = (props) => {
    return <div className="playlistExplorer_section">
        <div className="playlistExplorer_section_header">
            <h1>
                <Icons.MdRecommend />
                <Translation>
                    {(t) => t("May you like")}
                </Translation>
            </h1>
        </div>

        <div>
            <antd.Result
                status="warning"
                title="Failed to load"
                subTitle="We are sorry, but we could not load your recomendations. Please try again later."
            />
        </div>
    </div>
}

export default () => {
    return <div className="playlistExplorer">
        <RecentlyPlayed />

        <FollowingArtists />

        <PlaylistExplorer />

        <MayLike />
    </div>
}