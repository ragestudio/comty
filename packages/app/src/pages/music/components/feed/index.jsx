import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { ImageViewer, UserPreview } from "components"
import { Icons } from "components/Icons"
import { Translation } from "react-i18next"

import FeedModel from "models/feed"

import "./index.less"

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

        setOffset((value) => value - hopNumber)
    }

    const onClickNext = () => {
        if (ended) {
            return
        }

        setOffset((value) => value + hopNumber)
    }

    React.useEffect(() => {
        if (typeof makeRequest === "function") {
            makeRequest()
        }
    }, [offset])

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

        return app.setLocation(`/play/${playlist._id}`)
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
            <ImageViewer
                src={playlist.thumbnail ?? "/assets/no_song.png"}
            />
        </div>

        <div className="playlistItem_info">
            <div className="playlistItem_info_title" onClick={onClick}>
                <h1>{playlist.title}</h1>
            </div>
            <UserPreview user={playlist.user} />
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

const SearchResultItem = (props) => {
    return <div>
        <h1>SearchResultItem</h1>
    </div>
}

export default (props) => {
    const [searchLoading, setSearchLoading] = React.useState(false)
    const [searchFocused, setSearchFocused] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")
    const [searchResult, setSearchResult] = React.useState([])

    const handleSearchValueChange = (e) => {
        // not allow to input space as first character
        if (e.target.value[0] === " ") {
            return
        }

        setSearchValue(e.target.value)
    }

    const makeSearch = async (value) => {
        setSearchResult([])

        await new Promise((resolve) => setTimeout(resolve, 1000))

        setSearchResult([
            {
                title: "test",
                thumbnail: "/assets/no_song.png",
            },
            {
                title: "test2",
                thumbnail: "/assets/no_song.png",
            }
        ])
    }

    React.useEffect(() => {
        const timer = setTimeout(async () => {
            setSearchLoading(true)

            await makeSearch(searchValue)
            
            setSearchLoading(false)
        }, 400)

        if (searchValue === "") {
            if (typeof props.onEmpty === "function") {
                //props.onEmpty()
            }
        } else {
            if (typeof props.onFilled === "function") {
                //props.onFilled()
            }
        }

        return () => clearTimeout(timer)
    }, [searchValue])

    return <div
        className={classnames(
            "musicExplorer",
            {
                ["search-focused"]: searchFocused,
            }
        )}
    >
        <div className="searcher">
            <antd.Input
                placeholder="Search for music"
                prefix={<Icons.Search />}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onChange={handleSearchValueChange}
                value={searchValue}
            />

            <div className="searcher_result">
                {
                    searchLoading && <antd.Skeleton active />
                }
                {
                    searchFocused && searchValue !== "" && searchResult.length > 0  && searchResult.map((result, index) => {
                        return <SearchResultItem
                            key={index}
                            result={result}
                        />
                    })
                }
            </div>
        </div>

        <div className="feed_main">
            <RecentlyPlayed />

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
    </div>
}