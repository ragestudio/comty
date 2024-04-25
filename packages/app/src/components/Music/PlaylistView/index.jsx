import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import fuse from "fuse.js"

import useWsEvents from "@hooks/useWsEvents"

import { WithPlayerContext } from "@contexts/WithPlayerContext"
import { Context as PlaylistContext } from "@contexts/WithPlaylistContext"

import LoadMore from "@components/LoadMore"
import { Icons } from "@components/Icons"
import MusicTrack from "@components/Music/Track"
import SearchButton from "@components/SearchButton"
import ImageViewer from "@components/ImageViewer"

import MusicModel from "@models/music"

import "./index.less"

const PlaylistTypeDecorators = {
    "single": (props) => <span className="playlistType">
        <Icons.MdMusicNote />
        Single
    </span>,
    "album": (props) => <span className="playlistType">
        <Icons.MdAlbum />
        Album
    </span>,
    "ep": (props) => <span className="playlistType">
        <Icons.MdAlbum />
        EP
    </span>,
    "mix": (props) => <span className="playlistType">
        <Icons.MdMusicNote />
        Mix
    </span>,
}

const PlaylistInfo = (props) => {
    return <div>
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            children={props.data.description}
        />
    </div>
}

const MoreMenuHandlers = {
    "edit": async (playlist) => {

    },
    "delete": async (playlist) => {
        return antd.Modal.confirm({
            title: "Are you sure you want to delete this playlist?",
            onOk: async () => {
                const result = await MusicModel.deletePlaylist(playlist._id).catch((err) => {
                    console.log(err)

                    app.message.error("Failed to delete playlist")

                    return null
                })

                if (result) {
                    app.navigation.goToMusic()
                }
            }
        })
    }
}

export default (props) => {
    const [playlist, setPlaylist] = React.useState(props.playlist)
    const [searchResults, setSearchResults] = React.useState(null)
    const [owningPlaylist, setOwningPlaylist] = React.useState(app.cores.permissions.checkUserIdIsSelf(props.playlist?.user_id))

    const moreMenuItems = React.useMemo(() => {
        const items = [{
            key: "edit",
            label: "Edit",
        }]

        if (!playlist.type || playlist.type === "playlist") {
            if (app.cores.permissions.checkUserIdIsSelf(playlist.user_id)) {
                items.push({
                    key: "delete",
                    label: "Delete",
                })
            }
        }

        return items
    })

    const contextValues = {
        playlist_data: playlist,
        owning_playlist: owningPlaylist,
        add_track: (track) => {

        },
        remove_track: (track) => {

        }
    }

    let debounceSearch = null

    const handleOnClickPlaylistPlay = () => {
        app.cores.player.start(playlist.list, 0)
    }

    const handleOnClickViewDetails = () => {
        app.layout.modal.open("playlist_info", PlaylistInfo, {
            props: {
                data: playlist
            }
        })
    }

    const handleOnClickTrack = (track) => {
        // search index of track
        const index = playlist.list.findIndex((item) => {
            return item._id === track._id
        })

        if (index === -1) {
            return
        }

        // check if is currently playing
        if (app.cores.player.state.track_manifest?._id === track._id) {
            app.cores.player.playback.toggle()
        } else {
            app.cores.player.start(playlist.list, {
                startIndex: index
            })
        }
    }

    const handleTrackLike = async (track) => {
        return await MusicModel.toggleTrackLike(track._id)
    }

    const makeSearch = (value) => {
        //TODO: Implement me using API
        return app.message.info("Not implemented yet...")

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

        console.log(results)

        setSearchResults(results.map((result) => {
            return result.item
        }))
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

    const handleMoreMenuClick = async (e) => {
        const handler = MoreMenuHandlers[e.key]

        if (typeof handler !== "function") {
            throw new Error(`Invalid menu handler [${e.key}]`)
        }

        return await handler(playlist)
    }

    useWsEvents({
        "music:self:track:toggle:like": (data) => {
            updateTrackLike(data.track_id, data.action === "liked")
        }
    }, {
        socketName: "music",
    })

    React.useEffect(() => {
        setPlaylist(props.playlist)
        setOwningPlaylist(app.cores.permissions.checkUserIdIsSelf(props.playlist?.user_id))
    }, [props.playlist])

    if (!playlist) {
        return <antd.Skeleton active />
    }

    return <PlaylistContext.Provider value={contextValues}>
        <WithPlayerContext>
            <div
                className={classnames(
                    "playlist_view",
                    props.type ?? playlist.type,
                )}
            >

                <div className="play_info_wrapper">
                    <div className="play_info">
                        <div className="play_info_cover">
                            <ImageViewer src={playlist.cover ?? playlist?.thumbnail ?? "/assets/no_song.png"} />
                        </div>

                        <div className="play_info_details">
                            <div className="play_info_title">
                                {
                                    playlist.service === "tidal" && <Icons.SiTidal />
                                }
                                {
                                    typeof playlist.title === "function" ?
                                        playlist.title :
                                        <h1>{playlist.title}</h1>
                                }
                            </div>

                            <div className="play_info_statistics">
                                {
                                    playlist.type && PlaylistTypeDecorators[playlist.type] && <div className="play_info_statistics_item">
                                        {
                                            PlaylistTypeDecorators[playlist.type]()
                                        }
                                    </div>
                                }
                                <div className="play_info_statistics_item">
                                    <p>
                                        <Icons.MdLibraryMusic /> {props.length ?? playlist.total_length ?? playlist.list.length} Tracks
                                    </p>
                                </div>
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
                            </div>

                            <div className="play_info_actions">
                                <antd.Button
                                    type="primary"
                                    shape="rounded"
                                    size="large"
                                    onClick={handleOnClickPlaylistPlay}
                                >
                                    <Icons.MdPlayArrow />
                                    Play
                                </antd.Button>

                                {
                                    !props.favorite && <antd.Button
                                        icon={<Icons.MdFavorite />}
                                    />
                                }

                                {
                                    playlist.description && <antd.Button
                                        icon={<Icons.MdInfo />}
                                        onClick={handleOnClickViewDetails}
                                    />
                                }

                                {
                                    owningPlaylist &&
                                    <antd.Dropdown
                                        trigger={["click"]}
                                        placement="bottom"
                                        menu={{
                                            items: moreMenuItems,
                                            onClick: handleMoreMenuClick
                                        }}
                                    >
                                        <antd.Button
                                            icon={<Icons.MdMoreVert />}
                                        />
                                    </antd.Dropdown>

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

                    {
                        searchResults && searchResults.map((item) => {
                            return <MusicTrack
                                key={item._id}
                                order={item._id}
                                track={item}
                                onClickPlayBtn={() => handleOnClickTrack(item)}
                                onLike={() => handleTrackLike(item)}
                            />
                        })
                    }

                    {
                        !searchResults && playlist.list.length === 0 && <antd.Empty
                            description={
                                <>
                                    <Icons.MdLibraryMusic /> This playlist its empty!
                                </>
                            }
                        />
                    }

                    {
                        !searchResults && playlist.list.length > 0 && <LoadMore
                            className="list_content"
                            loadingComponent={() => <antd.Skeleton />}
                            onBottom={props.onLoadMore}
                            hasMore={props.hasMore}
                        >
                            <WithPlayerContext>
                                {
                                    playlist.list.map((item, index) => {
                                        return <MusicTrack
                                            order={index + 1}
                                            track={item}
                                            onClickPlayBtn={() => handleOnClickTrack(item)}
                                            onLike={() => handleTrackLike(item)}
                                        />
                                    })
                                }
                            </WithPlayerContext>
                        </LoadMore>
                    }
                </div>
            </div>
        </WithPlayerContext>
    </PlaylistContext.Provider>
}