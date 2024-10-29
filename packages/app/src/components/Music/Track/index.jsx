import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import RGBStringToValues from "@utils/rgbToValues"

import ImageViewer from "@components/ImageViewer"
import { Icons } from "@components/Icons"

import MusicModel from "@models/music"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"
import { Context as PlaylistContext } from "@contexts/WithPlaylistContext"

import "./index.less"

const handlers = {
    "like": async (ctx, track) => {
        await MusicModel.toggleItemFavourite("track", track._id, true)

        ctx.changeState({
            liked: true,
        })
        ctx.closeMenu()
    },
    "unlike": async (ctx, track) => {
        await MusicModel.toggleItemFavourite("track", track._id, false)

        ctx.changeState({
            liked: false,
        })
        ctx.closeMenu()
    },
}

const Track = (props) => {
    const [{
        loading,
        track_manifest,
        playback_status,
    }] = usePlayerStateContext()

    const playlist_ctx = React.useContext(PlaylistContext)

    const [moreMenuOpened, setMoreMenuOpened] = React.useState(false)

    const isCurrent = track_manifest?._id === props.track._id
    const isPlaying = isCurrent && playback_status === "playing"

    const handleClickPlayBtn = React.useCallback(() => {
        if (typeof props.onClickPlayBtn === "function") {
            props.onClickPlayBtn(props.track)
        } else {
            console.warn("Searcher: onClick is not a function, using default action...")
            if (!isCurrent) {
                app.cores.player.start(props.track)
            } else {
                app.cores.player.playback.toggle()
            }
        }
    })

    const handleOnClickItem = () => {
        if (app.isMobile) {
            handleClickPlayBtn()
        }
    }

    const handleMoreMenuOpen = () => {
        if (app.isMobile) {
            return
        }

        return setMoreMenuOpened((prev) => {
            return !prev
        })
    }

    const handleMoreMenuItemClick = (e) => {
        const { key } = e

        if (typeof handlers[key] === "function") {
            return handlers[key](
                {
                    closeMenu: () => {
                        setMoreMenuOpened(false)
                    },
                    changeState: props.changeState,
                },
                props.track
            )
        }
    }

    const moreMenuItems = React.useMemo(() => {
        const items = [
            {
                key: "like",
                icon: <Icons.MdFavorite />,
                label: "Like",
            },
            {
                key: "share",
                icon: <Icons.MdShare />,
                label: "Share",
                disabled: true,
            },
            {
                key: "add_to_playlist",
                icon: <Icons.MdPlaylistAdd />,
                label: "Add to playlist",
                disabled: true,
            },
            {
                key: "add_to_queue",
                icon: <Icons.MdQueueMusic />,
                label: "Add to queue",
                disabled: true,
            }
        ]

        if (props.track.liked) {
            items[0] = {
                key: "unlike",
                icon: <Icons.MdFavorite />,
                label: "Unlike",
            }
        }

        if (playlist_ctx) {
            if (playlist_ctx.owning_playlist) {
                items.push({
                    type: "divider",
                })

                items.push({
                    key: "remove_from_playlist",
                    icon: <Icons.MdPlaylistRemove />,
                    label: "Remove from playlist",
                })
            }
        }

        return items
    }, [props.track])

    return <div
        id={props.track._id}
        className={classnames(
            "music-track",
            {
                ["current"]: isCurrent,
                ["playing"]: isPlaying,
                ["loading"]: isCurrent && loading
            }
        )}
        style={{
            "--cover_average-color": RGBStringToValues(track_manifest?.cover_analysis?.rgb),
        }}
        onClick={handleOnClickItem}
    >
        <div
            className="music-track_background"
        />

        <div className="music-track_content">
            {
                !app.isMobile && <div className={classnames(
                    "music-track_actions",
                    {
                        ["withOrder"]: props.order !== undefined,
                    }
                )}>
                    <div className="music-track_action">
                        <span className="music-track_orderIndex">
                            {
                                props.order
                            }
                        </span>
                        <antd.Button
                            type="primary"
                            shape="circle"
                            icon={isPlaying ? <Icons.MdPause /> : <Icons.MdPlayArrow />}
                            onClick={handleClickPlayBtn}
                        />
                    </div>
                </div>
            }

            <div className="music-track_cover">
                <ImageViewer src={props.track.cover ?? props.track.thumbnail} />
            </div>

            <div className="music-track_details">
                <div className="music-track_title">
                    <span>
                        {
                            props.track.service === "tidal" && <Icons.SiTidal />
                        }
                        {
                            props.track.title
                        }
                    </span>
                </div>
                <div className="music-track_artist">
                    <span>
                        {
                            Array.isArray(props.track.artists) ? props.track.artists.join(", ") : props.track.artist
                        }
                    </span>
                </div>
            </div>

            <div className="music-track_right_actions">
                <antd.Dropdown
                    menu={{
                        items: moreMenuItems,
                        onClick: handleMoreMenuItemClick
                    }}
                    onOpenChange={handleMoreMenuOpen}
                    open={moreMenuOpened}
                    trigger={["click"]}
                >
                    <antd.Button
                        type="ghost"
                        size="large"
                        icon={<Icons.IoMdMore />}
                    />
                </antd.Dropdown>
            </div>
        </div>
    </div>
}

export default Track