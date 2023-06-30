import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Translation } from "react-i18next"

import Searcher from "components/Searcher"
import { ImageViewer } from "components"
import { Icons, createIconRender } from "components/Icons"

import { WithPlayerContext } from "contexts/WithPlayerContext"

import FeedModel from "models/feed"
import PlaylistModel from "models/playlists"

import MusicTrack from "components/MusicTrack"

import "./index.less"

const MusicNavbar = (props) => {
    return <div className="music_navbar">
        <Searcher
            useUrlQuery
            renderResults={false}
            model={PlaylistModel.search}
            onSearchResult={props.setSearchResults}
            onEmpty={() => props.setSearchResults(false)}
        />
    </div>
}

const PlaylistsList = (props) => {
    const hopNumber = props.hopsPerPage ?? 6

    const [offset, setOffset] = React.useState(0)
    const [ended, setEnded] = React.useState(false)

    const [loading, result, error, makeRequest] = app.cores.api.useRequest(props.fetchMethod, {
        limit: hopNumber,
        trim: offset
    })

    const onClickPrev = () => {
        if (offset === 0) {
            return
        }

        setOffset((value) => {
            const newOffset = value - hopNumber

            // check if newOffset is NaN
            if (newOffset !== newOffset) {
                return false
            }

            if (typeof makeRequest === "function") {
                makeRequest({
                    trim: newOffset,
                    limit: hopNumber,
                })
            }

            return newOffset
        })
    }

    const onClickNext = () => {
        if (ended) {
            return
        }

        setOffset((value) => {
            const newOffset = value + hopNumber

            // check if newOffset is NaN
            if (newOffset !== newOffset) {
                return false
            }

            if (typeof makeRequest === "function") {
                makeRequest({
                    trim: newOffset,
                    limit: hopNumber,
                })
            }

            return newOffset
        })
    }

    React.useEffect(() => {
        if (result) {
            setEnded(result.length < hopNumber)
        }
    }, [result])

    if (error) {
        console.error(error)

        return <div className="playlistExplorer_section">
            <antd.Result
                status="warning"
                title="Failed to load"
                subTitle="We are sorry, but we could not load this requests. Please try again later."
            />
        </div>
    }

    return <div className="playlistExplorer_section">
        <div className="playlistExplorer_section_header">
            <h1>
                {
                    props.headerIcon
                }
                <Translation>
                    {(t) => t(props.headerTitle)}
                </Translation>
            </h1>

            <div className="playlistExplorer_section_header_actions">
                <antd.Button
                    icon={<Icons.MdChevronLeft />}
                    onClick={onClickPrev}
                    disabled={offset === 0 || loading}
                />

                <antd.Button
                    icon={<Icons.MdChevronRight />}
                    onClick={onClickNext}
                    disabled={ended || loading}
                />
            </div>
        </div>
        <div className="playlistExplorer_section_list">
            {
                loading && <antd.Skeleton active />
            }
            {
                !loading && result.map((playlist, index) => {
                    return <PlaylistItem
                        key={index}
                        playlist={playlist}
                    />
                })
            }
        </div>
    </div>
}

const PlaylistItem = (props) => {
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

const ResultGroupsDecorators = {
    "playlists": {
        icon: "MdPlaylistPlay",
        label: "Playlists",
        renderItem: (props) => {
            return <PlaylistItem
                key={props.key}
                playlist={props.item}
            />
        }
    },
    "tracks": {
        icon: "MdMusicNote",
        label: "Tracks",
        renderItem: (props) => {
            return <MusicTrack
                key={props.key}
                track={props.item}
                onClick={() => app.cores.player.start(props.item)}
            />
        }
    }
}

const SearchResults = ({
    data
}) => {
    if (typeof data !== "object") {
        return null
    }

    let groupsKeys = Object.keys(data)

    // filter out empty groups
    groupsKeys = groupsKeys.filter((key) => {
        return data[key].length > 0
    })

    if (groupsKeys.length === 0) {
        return <div className="music-explorer_search_results no_results">
            <antd.Result
                status="info"
                title="No results"
                subTitle="We are sorry, but we could not find any results for your search."
            />
        </div>
    }

    return <div
        className={classnames(
            "music-explorer_search_results",
            {
                ["one_column"]: groupsKeys.length === 1,
            }
        )}
    >
        <WithPlayerContext>
            {
                groupsKeys.map((key, index) => {
                    const decorator = ResultGroupsDecorators[key] ?? {
                        icon: null,
                        label: key,
                        renderItem: () => null
                    }

                    return <div className="music-explorer_search_results_group" key={index}>
                        <div className="music-explorer_search_results_group_header">
                            <h1>
                                {
                                    createIconRender(decorator.icon)
                                }
                                <Translation>
                                    {(t) => t(decorator.label)}
                                </Translation>
                            </h1>
                        </div>

                        <div className="music-explorer_search_results_group_list">
                            {
                                data[key].map((item, index) => {
                                    return decorator.renderItem({
                                        key: index,
                                        item
                                    })
                                })
                            }
                        </div>
                    </div>
                })
            }
        </WithPlayerContext>
    </div>
}

export default (props) => {
    const [searchResults, setSearchResults] = React.useState(false)

    React.useEffect(() => {
        if (app.isMobile) {
            app.layout.toggleCenteredContent(true)
        }

        app.layout.page_panels.attachComponent("music_navbar", MusicNavbar, {
            props: {
                setSearchResults: setSearchResults
            }
        })

        return () => {
            if (app.layout.page_panels) {
                app.layout.page_panels.detachComponent("music_navbar")
            }

            if (app.isMobile) {
                app.layout.toggleCenteredContent(false)
            }
        }
    }, [])

    return <div
        className={classnames(
            "musicExplorer",
        )}
    >
        {
            app.isMobile && <Searcher
                useUrlQuery
                renderResults={false}
                model={PlaylistModel.search}
                onSearchResult={setSearchResults}
                onEmpty={() => setSearchResults(false)}
            />
        }

        {
            searchResults && <SearchResults
                data={searchResults}
            />
        }

        {
            !searchResults && <div className="feed_main">
                <PlaylistsList
                    headerTitle="From your following artists"
                    headerIcon={<Icons.MdPerson />}
                    fetchMethod={FeedModel.getPlaylistsFeed}
                />

                <PlaylistsList
                    headerTitle="Explore from global"
                    headerIcon={<Icons.MdExplore />}
                    fetchMethod={FeedModel.getGlobalMusicFeed}
                />
            </div>
        }
    </div>
}