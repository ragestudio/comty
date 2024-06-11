import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Translation } from "react-i18next"

import Image from "@components/Image"
import Searcher from "@components/Searcher"
import { Icons, createIconRender } from "@components/Icons"
import MusicTrack from "@components/Music/Track"
import PlaylistItem from "@components/Music/PlaylistItem"

import ReleasesList from "@components/ReleasesList"

import FeedModel from "@models/feed"
import MusicModel from "@models/music"

import "./index.less"

const FeaturedPlaylist = (props) => {
    const [featuredPlaylist, setFeaturedPlaylist] = React.useState(false)

    const onClick = () => {
        if (!featuredPlaylist) {
            return
        }

        app.navigation.goToPlaylist(featuredPlaylist.playlist_id)
    }

    React.useEffect(() => {
        MusicModel.getFeaturedPlaylists().then((data) => {
            if (data[0]) {
                console.log(`Loaded featured playlist >`, data[0])
                setFeaturedPlaylist(data[0])
            }
        })
    }, [])

    if (!featuredPlaylist) {
        return null
    }

    return <div className="featured_playlist" onClick={onClick}>
        <Image
            src={featuredPlaylist.cover_url}
        />

        <div className="featured_playlist_content">
            <h1>{featuredPlaylist.title}</h1>
            <p>{featuredPlaylist.description}</p>

            {
                featuredPlaylist.genre && <div className="featured_playlist_genre">
                    <span>{featuredPlaylist.genre}</span>
                </div>
            }
        </div>
    </div>
}

const MusicNavbar = (props) => {
    return <div className="music_navbar">
        <Searcher
            useUrlQuery
            renderResults={false}
            model={MusicModel.search}
            onSearchResult={props.setSearchResults}
            onEmpty={() => props.setSearchResults(false)}
        />
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
                onClickPlayBtn={() => app.cores.player.start(props.item)}
                onClick={() => app.location.push(`/play/${props.item._id}`)}
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
    </div>
}

export default (props) => {
    const [searchResults, setSearchResults] = React.useState(false)

    React.useEffect(() => {
        app.layout.toggleCenteredContent(true)

        app.layout.page_panels.attachComponent("music_navbar", MusicNavbar, {
            props: {
                setSearchResults: setSearchResults,
            }
        })

        return () => {
            if (app.layout.page_panels) {
                app.layout.page_panels.detachComponent("music_navbar")
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
                model={MusicModel.search}
                modelParams={{
                    useTidal: app.cores.sync.getActiveLinkedServices().tidal,
                }}
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
                <FeaturedPlaylist />

                <ReleasesList
                    headerTitle="From your following artists"
                    headerIcon={<Icons.MdPerson />}
                    fetchMethod={FeedModel.getMusicFeed}
                />

                <ReleasesList
                    headerTitle="Explore from global"
                    headerIcon={<Icons.MdExplore />}
                    fetchMethod={FeedModel.getGlobalMusicFeed}
                />
            </div>
        }
    </div>
}