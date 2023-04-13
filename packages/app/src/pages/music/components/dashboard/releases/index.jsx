import React from "react"
import * as antd from "antd"

import { Icons } from "components/Icons"
import { ImageViewer } from "components"

import PlaylistCreator from "../../../creator"

import PlaylistsModel from "models/playlists"
import "./index.less"

const ReleaseItem = (props) => {
    const { key, release } = props

    return <div
        className="music_panel_releases_item"
        key={key}
        id={key}
    >
        <div
            className="music_panel_releases_info"
        >
            <div
                className="music_panel_releases_info_cover"
            >
                <ImageViewer
                    src={release.thumbnail ?? "/assets/no_song.png"}
                />
            </div>
            <div
                className="music_panel_releases_info_title"
            >
                <h1>
                    {release.title}
                </h1>

                <h4>
                    {release.description}
                </h4>
            </div>
        </div>

        <div
            className="music_panel_releases_actions"
        >
            <antd.Button
                onClick={props.onClickEditTrack}
                icon={<Icons.Edit />}
            >
                Modify
            </antd.Button>
        </div>
    </div>
}

export default (props) => {
    const openPlaylistCreator = (playlist_id) => {
        console.log("Opening playlist creator", playlist_id)

        app.DrawerController.open("playlist_creator", PlaylistCreator, {
            type: "drawer",
            props: {
                title: <h2
                    style={{
                        margin: 0,
                    }}
                >
                    <Icons.MdOutlineQueueMusic />
                    Creator
                </h2>,
                width: "50%",
            },
            componentProps: {
                playlist_id: playlist_id,
            }
        })
    }

    const [L_Releases, R_Releases, E_Releases] = app.cores.api.useRequest(PlaylistsModel.getMyReleases)

    if (E_Releases) {
        console.error(E_Releases)

        return <antd.Result
            status="warning"
            title="Failed to load"
            subTitle="We are sorry, but we could not load your releases. Please try again later."
        />
    }

    if (L_Releases) {
        return <antd.Skeleton active />
    }

    return <div
        className="music_panel_creator"
    >
        <div className="music_panel_releases_header">
            <h1>
                <Icons.Music />
                Your releases
            </h1>

            <div className="music_panel_releases_header_actions">
                <antd.Button
                    onClick={() => openPlaylistCreator()}
                    icon={<Icons.Plus />}
                    type="primary"
                >
                    New release
                </antd.Button>
            </div>
        </div>

        <div className="music_panel_releases_list">
            {
                R_Releases.map((release) => {
                    return <ReleaseItem
                        key={release._id}
                        release={release}
                        onClickEditTrack={() => openPlaylistCreator(release._id)}
                    />
                })
            }
        </div>
    </div>
}