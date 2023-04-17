import React from "react"
import * as antd from "antd"
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

        <MayLike />
    </div>
}