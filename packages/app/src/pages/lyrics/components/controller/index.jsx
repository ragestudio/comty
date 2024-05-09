import React from "react"
import { Tag } from "antd"
import classnames from "classnames"
import Marquee from "react-fast-marquee"

import { Icons } from "@components/Icons"
import Controls from "@components/Player/Controls"

import { Context } from "@contexts/WithPlayerContext"

function isOverflown(element) {
    if (!element) {
        return false
    }

    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

const RenderArtist = (props) => {
    const { artist } = props

    if (!artist) {
        return null
    }

    if (Array.isArray(artist)) {
        return <h3>{artist.join(",")}</h3>
    }

    return <h3>{artist}</h3>
}

const RenderAlbum = (props) => {
    const { album } = props

    if (!album) {
        return null
    }

    if (Array.isArray(album)) {
        return <h3>{album.join(",")}</h3>
    }

    return <h3>{album}</h3>
}

const PlayerController = React.forwardRef((props, ref) => {
    const context = React.useContext(Context)

    const titleRef = React.useRef()

    const [titleIsOverflown, setTitleIsOverflown] = React.useState(false)

    const [currentTime, setCurrentTime] = React.useState(0)
    const [trackDuration, setTrackDuration] = React.useState(0)
    const [draggingTime, setDraggingTime] = React.useState(false)
    const [currentDragWidth, setCurrentDragWidth] = React.useState(0)
    const [syncInterval, setSyncInterval] = React.useState(null)

    async function onDragEnd(seekTime) {
        setDraggingTime(false)

        app.cores.player.seek(seekTime)
    }

    async function syncPlayback() {
        if (!context.track_manifest) {
            return false
        }

        const currentTrackTime = app.cores.player.seek()

        setCurrentTime(currentTrackTime)
    }

    //* Handle when playback status change
    React.useEffect(() => {
        if (context.playback_status === "playing") {
            setSyncInterval(setInterval(syncPlayback, 1000))
        } else {
            if (syncInterval) {
                clearInterval(syncInterval)
            }
        }
    }, [context.playback_status])

    React.useEffect(() => {
        setTitleIsOverflown(isOverflown(titleRef.current))
        setTrackDuration(app.cores.player.duration())
    }, [context.track_manifest])

    const isStopped = context.playback_status === "stopped"

    return <div
        className="lyrics-player-controller-wrapper"
    >
        <div className="lyrics-player-controller">
            <div className="lyrics-player-controller-info">
                <div className="lyrics-player-controller-info-title">
                    {
                        <h4
                            ref={titleRef}
                            className={classnames(
                                "lyrics-player-controller-info-title-text",
                                {
                                    ["overflown"]: titleIsOverflown,
                                }
                            )}
                        >
                            {
                                context.playback_status === "stopped" ? "Nothing is playing" : <>
                                    {context.track_manifest?.title ?? "Nothing is playing"}
                                </>
                            }
                        </h4>
                    }

                    {
                        titleIsOverflown && <Marquee
                            //gradient
                            //gradientColor={bgColor}
                            //gradientWidth={20}
                            play={!isStopped}
                        >
                            <h4>
                                {
                                    isStopped ?
                                        "Nothing is playing" :
                                        <>
                                            {context.track_manifest?.title ?? "Untitled"}
                                        </>
                                }
                            </h4>
                        </Marquee>
                    }
                </div>

                <div className="lyrics-player-controller-info-details">
                    <RenderArtist artist={context.track_manifest?.artists} />
                    -
                    <RenderAlbum album={context.track_manifest?.album} />
                </div>
            </div>

            <Controls />

            <div className="lyrics-player-controller-progress-wrapper">
                <div
                    className="lyrics-player-controller-progress"
                    onMouseDown={(e) => {
                        setDraggingTime(true)
                    }}
                    onMouseUp={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const seekTime = trackDuration * (e.clientX - rect.left) / rect.width

                        onDragEnd(seekTime)
                    }}
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const atWidth = (e.clientX - rect.left) / rect.width * 100

                        setCurrentDragWidth(atWidth)
                    }}
                >
                    <div className="lyrics-player-controller-progress-bar"
                        style={{
                            width: `${draggingTime ? currentDragWidth : ((currentTime / trackDuration) * 100)}%`
                        }}
                    />
                </div>
            </div>

            <div className="lyrics-player-controller-tags">
                {
                    context.track_manifest?.metadata.lossless && <Tag
                        color="geekblue"
                        icon={<Icons.TbWaveSine />}
                        bordered={false}
                    >
                        Lossless
                    </Tag>
                }
                {
                    context.track_manifest?.explicit && <Tag
                        bordered={false}
                    >
                        Explicit
                    </Tag>
                }
            </div>
        </div>
    </div>
})

export default PlayerController