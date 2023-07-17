import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import moment from "moment"
import fuse from "fuse.js"
import useWsEvents from "hooks/useWsEvents"

import { WithPlayerContext } from "contexts/WithPlayerContext"

import { ImageViewer } from "components"
import { Icons } from "components/Icons"

import PlaylistsModel from "models/playlists"
import MusicTrack from "components/Music/Track"

import SearchButton from "components/SearchButton"

import "./index.less"

export default (props) => {
    const [playlist, setPlaylist] = React.useState(props.playlist)
    const [searchResults, setSearchResults] = React.useState(null)

    let debounceSearch = null

    const handleOnClickTrack = (track) => {
        // search index of track
        const index = playlist.list.findIndex((item) => {
            return item._id === track._id
        })

        if (index === -1) {
            return
        }

        app.cores.player.startPlaylist(playlist.list, index)
    }

    const handleTrackLike = async (track) => {
        return await PlaylistsModel.toggleTrackLike(track._id)
    }

    const makeSearch = (value) => {
        const options = {
            includeScore: true,
            keys: [
                "title",
                "artist",
                "album",
            ],
        }

        const fuseInstance = new fuse(playlist.list, options)
        const results = fuseInstance.search(value)

        setSearchResults(results.map((result) => {
            return result.item
        }))
    }

    const returnTracks = (list) => {
        return list.map((item, index) => {
            return <MusicTrack
                order={index + 1}
                track={item}
                onClickPlayBtn={() => handleOnClickTrack(item)}
                onLike={() => handleTrackLike(item)}
            />
        })
    }

    const handleOnSearchChange = (value) => {
        debounceSearch = setTimeout(() => {
            makeSearch(value)
        }, 500)
    }

    const handleOnSearchEmpty = () => {
        if (debounceSearch) {
            clearTimeout(debounceSearch)
        }

        setSearchResults(null)
    }

    const updateTrackLike = (track_id, liked) => {
        setPlaylist((prev) => {
            const index = prev.list.findIndex((item) => {
                return item._id === track_id
            })

            if (index !== -1) {
                const newState = {
                    ...prev,
                }

                newState.list[index].liked = liked

                return newState
            }

            return prev
        })
    }

    useWsEvents({
        "music:self:track:toggle:like": (data) => {
            updateTrackLike(data.track_id, data.action === "liked")
        }
    }, {
        socketName: "music",
    })

    if (!playlist) {
        return <antd.Skeleton active />
    }

    return <div
        className={
            classnames("playlist_view", props.type ?? playlist.type)
        }
    >
        <div className="play_info_wrapper">
            <div className="play_info">
                <div className="play_info_cover">
                    <ImageViewer src={playlist.cover ?? playlist?.thumbnail ?? "/assets/no_song.png"} />
                </div>

                <div className="play_info_details">
                    <div className="play_info_title">
                        {typeof playlist.title === "function" ? playlist.title : <h1>{playlist.title}</h1>}
                    </div>

                    {
                        playlist.description && <div className="play_info_description">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {playlist.description}
                            </ReactMarkdown>
                        </div>
                    }

                    <div className="play_info_statistics">
                        {
                            playlist.publisher && <div className="play_info_statistics_item">
                                <p
                                    onClick={() => {
                                        app.navigation.goToAccount(playlist.publisher.username)
                                    }}
                                >
                                    <Icons.MdPerson />

                                    Publised by <a>{playlist.publisher.username}</a>
                                </p>
                            </div>
                        }
                        <div className="play_info_statistics_item">
                            <p>
                                <Icons.MdLibraryMusic /> {playlist.list.length} Tracks
                            </p>
                        </div>

                        {
                            playlist.created_at && <div className="play_info_statistics_item">
                                <p>
                                    <Icons.MdAccessTime /> Released on {moment(playlist.created_at).format("DD/MM/YYYY")}
                                </p>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>

        <div className="list">
            <div className="list_header">
                <h1>
                    <Icons.MdPlaylistPlay /> Tracks
                </h1>

                <SearchButton
                    onChange={handleOnSearchChange}
                    onEmpty={handleOnSearchEmpty}
                />
            </div>

            <WithPlayerContext>
                {
                    returnTracks(searchResults ?? playlist.list)
                }
            </WithPlayerContext>
        </div>
    </div>
}