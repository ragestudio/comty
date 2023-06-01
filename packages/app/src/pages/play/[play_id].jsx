import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import moment from "moment"
import fuse from "fuse.js"

import { WithPlayerContext } from "contexts/WithPlayerContext"

import { ImageViewer } from "components"
import { Icons } from "components/Icons"

import PlaylistsModel from "models/playlists"
import MusicTrack from "components/MusicTrack"

import SearchButton from "components/SearchButton"

import "./index.less"

export default (props) => {
    const play_id = props.params.play_id

    const [playlist, setPlaylist] = React.useState(null)
    const [searchResults, setSearchResults] = React.useState(null)

    let debounceSearch = null

    const loadData = async () => {
        const response = await PlaylistsModel.getPlaylist(play_id).catch((err) => {
            console.error(err)
            app.message.error("Failed to load playlist")
            return null
        })

        console.log(response)

        if (response) {
            setPlaylist(response)
        }
    }

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
                onClick={() => handleOnClickTrack(item)}
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

    React.useEffect(() => {
        loadData()
    }, [])

    if (!playlist) {
        return <antd.Skeleton active />
    }

    return <div
        className={
            classnames("play", playlist.type)
        }
    >
        <div className="play_info_wrapper">
            <div className="play_info">
                <div className="play_info_cover">
                    <ImageViewer src={playlist.cover ?? playlist?.thumbnail ?? "/assets/no_song.png"} />
                </div>

                <div className="play_info_details">
                    <div className="play_info_title">
                        <h1>{playlist.title}</h1>
                    </div>

                    <div className="play_info_description">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {playlist.description}
                        </ReactMarkdown>
                    </div>

                    <div className="play_info_statistics">
                        {
                            playlist.publisher && <div className="play_info_statistics_item">
                                <p
                                    onClick={() => {
                                        app.navigation.goToAccount(playlist.user.username)
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

                        <div className="play_info_statistics_item">
                            <p>
                                <Icons.MdAccessTime /> Released on {moment(playlist.created_at).format("DD/MM/YYYY")}
                            </p>
                        </div>
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