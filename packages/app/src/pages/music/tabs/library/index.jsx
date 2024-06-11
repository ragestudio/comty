import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import Image from "@components/Image"
import { Icons } from "@components/Icons"
import OpenPlaylistCreator from "@components/Music/PlaylistCreator"

import MusicModel from "@models/music"

import "./index.less"

const ReleaseTypeDecorators = {
    "user": () => <p >
        <Icons.MdPlaylistAdd />
        Playlist
    </p>,
    "playlist": () => <p >
        <Icons.MdPlaylistAdd />
        Playlist
    </p>,
    "editorial": () => <p >
        <Icons.MdPlaylistAdd />
        Official Playlist
    </p>,
    "single": () => <p >
        <Icons.MdMusicNote />
        Single
    </p>,
    "album": () => <p >
        <Icons.MdAlbum />
        Album
    </p>,
    "ep": () => <p >
        <Icons.MdAlbum />
        EP
    </p>,
    "mix": () => <p >
        <Icons.MdMusicNote />
        Mix
    </p>,
}

function isNotAPlaylist(type) {
    return type === "album" || type === "ep" || type === "mix" || type === "single"
}

const PlaylistItem = (props) => {
    const data = props.data ?? {}

    const handleOnClick = () => {
        if (typeof props.onClick === "function") {
            props.onClick(data)
        }

        if (props.type !== "action") {
            if (data.service) {
                return app.navigation.goToPlaylist(`${data._id}?service=${data.service}`)
            }

            return app.navigation.goToPlaylist(data._id)
        }
    }

    return <div
        className={classnames(
            "playlist_item",
            {
                ["action"]: props.type === "action",
                ["release"]: isNotAPlaylist(data.type),
            }
        )}
        onClick={handleOnClick}
    >
        <div className="playlist_item_icon">
            {
                React.isValidElement(data.icon)
                    ? <div className="playlist_item_icon_svg">
                        {data.icon}
                    </div>
                    : <Image
                        src={data.icon}
                        alt="playlist icon"
                    />
            }
        </div>

        <div className="playlist_item_info">
            <div className="playlist_item_info_title">
                <h1>
                    {
                        data.service === "tidal" && <Icons.SiTidal />
                    }
                    {
                        data.title ?? "Unnamed playlist"
                    }
                </h1>
            </div>

            {
                data.owner && <div className="playlist_item_info_owner">
                    <h4>
                        {
                            data.owner
                        }
                    </h4>
                </div>
            }

            {
                data.description && <div className="playlist_item_info_description">
                    <p>
                        {
                            data.description
                        }
                    </p>

                    {
                        ReleaseTypeDecorators[String(data.type).toLowerCase()] && ReleaseTypeDecorators[String(data.type).toLowerCase()](props)
                    }

                    {
                        data.public
                            ? <p>
                                <Icons.MdVisibility />
                                Public
                            </p>

                            : <p>
                                <Icons.MdVisibilityOff />
                                Private
                            </p>
                    }
                </div>
            }
        </div>
    </div>
}

const OwnPlaylists = (props) => {
    const [L_Playlists, R_Playlists, E_Playlists, M_Playlists] = app.cores.api.useRequest(MusicModel.getFavoritePlaylists)

    if (E_Playlists) {
        console.error(E_Playlists)

        return <antd.Result
            status="warning"
            title="Failed to load"
            subTitle="We are sorry, but we could not load your playlists. Please try again later."
        />
    }

    if (L_Playlists) {
        return <antd.Skeleton />
    }

    return <div className="own_playlists">
        <PlaylistItem
            type="action"
            data={{
                icon: <Icons.MdPlaylistAdd />,
                title: "Create new",
            }}
            onClick={OpenPlaylistCreator}
        />

        {
            R_Playlists.items.map((playlist) => {
                playlist.icon = playlist.cover ?? playlist.thumbnail
                playlist.description = `${playlist.numberOfTracks ?? playlist.list.length} tracks`

                return <PlaylistItem
                    key={playlist.id}
                    data={playlist}
                />
            })
        }
    </div>
}

const Library = (props) => {
    return <div className="music-library">
        <div className="music-library_header">
            <h1>Library</h1>

            <antd.Segmented
                options={[
                    {
                        value: "tracks",
                        label: "Tracks",
                        icon: <Icons.MdMusicNote />
                    },
                    {
                        value: "playlist",
                        label: "Playlists",
                        icon: <Icons.MdPlaylistPlay />
                    },
                ]}
            />
        </div>
        <PlaylistItem
            type="action"
            data={{
                icon: <Icons.MdPlaylistAdd />,
                title: "Create new",
            }}
            onClick={OpenPlaylistCreator}
        />
        <OwnPlaylists />
    </div>
}

export default Library