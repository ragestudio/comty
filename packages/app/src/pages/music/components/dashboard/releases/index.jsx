import React from "react"
import * as antd from "antd"

import { Icons } from "components/Icons"
import { ImageViewer } from "components"
import Searcher from "components/Searcher"

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
                    src={release.cover ?? release.thumbnail ?? "/assets/no_song.png"}
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
                onClick={props.onClickNavigate}
            >
                Open
            </antd.Button>

            <antd.Button
                onClick={props.onClickEditTrack}
                icon={<Icons.Edit />}
            >
                Modify
            </antd.Button>
        </div>
    </div>
}

const openPlaylistCreator = ({
    playlist_id = null,
    onModification = () => { }
} = {}) => {
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
            width: "fit-content",
        },
        componentProps: {
            playlist_id: playlist_id,
            onModification: onModification,
        }
    })
}

const navigateToPlaylist = (playlist_id) => {
    return app.setLocation(`/play/${playlist_id}`)
}

export default (props) => {
    const [searchResults, setSearchResults] = React.useState(null)
    const [L_Releases, R_Releases, E_Releases, M_Releases] = app.cores.api.useRequest(PlaylistsModel.getMyReleases)

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
                    onClick={() => openPlaylistCreator({
                        onModification: M_Releases,
                    })}
                    icon={<Icons.Plus />}
                    type="primary"
                >
                    New release
                </antd.Button>
            </div>
        </div>

        <Searcher
            small
            renderResults={false}
            model={PlaylistsModel.getMyReleases}
            onSearchResult={setSearchResults}
            onEmpty={() => setSearchResults(null)}
        />

        <div className="music_panel_releases_list">
            {
                searchResults && searchResults.length === 0 && <antd.Result
                    status="info"
                    title="No results"
                    subTitle="We are sorry, but we could not find any results for your search."
                />
            }
            {
                searchResults && searchResults.length > 0 && searchResults.map((release) => {
                    return <ReleaseItem
                        key={release._id}
                        release={release}
                        onClickEditTrack={() => openPlaylistCreator({
                            playlist_id: release._id,
                            onModification: M_Releases,
                        })}
                        onClickNavigate={() => navigateToPlaylist(release._id)}
                    />
                })
            }
            {
                !searchResults && R_Releases.map((release) => {
                    return <ReleaseItem
                        key={release._id}
                        release={release}
                        onClickEditTrack={() => openPlaylistCreator({
                            playlist_id: release._id,
                            onModification: M_Releases,
                        })}
                        onClickNavigate={() => navigateToPlaylist(release._id)}
                    />
                })
            }
        </div>
    </div>
}