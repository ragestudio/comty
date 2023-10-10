import React from "react"
import { WithPlayerContext, Context } from "contexts/WithPlayerContext"

import { Icons } from "components/Icons"

import Marquee from "react-fast-marquee"

import * as antd from "antd"
import classnames from "classnames"

import SeekBar from "components/Player/SeekBar"
import Controls from "components/Player/Controls"

import RGBStringToValues from "utils/rgbToValues"

import LikeButton from "components/LikeButton"

import "./index.less"

function isOverflown(parent, element) {
    if (!parent || !element) {
        return false
    }

    const parentRect = parent.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()

    return elementRect.width > parentRect.width
}

const ServiceIndicator = (props) => {
    if (!props.service) {
        return null
    }

    switch (props.service) {
        case "tidal": {
            return <div className="service_indicator">
                <Icons.SiTidal />
            </div>
        }
        default: {
            return null
        }
    }
}

const ExtraActions = (props) => {
    return <div className="extra_actions">
        <LikeButton />

        <antd.Button
            type="ghost"
            icon={<Icons.MdQueueMusic />}
        />
    </div>
}

const Player = (props) => {
    const ctx = React.useContext(Context)

    const contentRef = React.useRef()
    const titleRef = React.useRef()
    const subtitleRef = React.useRef()

    const [topActionsVisible, setTopActionsVisible] = React.useState(false)
    const [titleOverflown, setTitleOverflown] = React.useState(false)
    const [subtitleOverflown, setSubtitleOverflown] = React.useState(false)

    const handleOnMouseInteraction = (e) => {
        if (e.type === "mouseenter") {
            setTopActionsVisible(true)
        } else {
            setTopActionsVisible(false)
        }
    }

    const {
        title,
        album,
        artist,
        liked,
        service,
        lyricsEnabled,
        cover_analysis,
        cover,
    } = ctx.track_manifest ?? {}

    const playing = ctx.playback_status === "playing"
    const stopped = ctx.playback_status === "stopped"

    const titleText = (!playing && stopped) ? "Stopped" : (title ?? "Untitled")
    const subtitleText = ""

    React.useEffect(() => {
        const titleIsOverflown = isOverflown(contentRef.current, titleRef.current)

        setTitleOverflown(titleIsOverflown)
    }, [title])

    return <div
        className={classnames(
            "toolbar_player_wrapper",
            {
                "hover": topActionsVisible,
                "minimized": ctx.minimized,
                "cover_light": cover_analysis?.isLight,
            }
        )}
        style={{
            "--cover_averageValues": RGBStringToValues(cover_analysis?.rgb),
            "--cover_isLight": cover_analysis?.isLight,
        }}
        onMouseEnter={handleOnMouseInteraction}
        onMouseLeave={handleOnMouseInteraction}
    >
        <div
            className={classnames(
                "toolbar_player_top_actions",
            )}
        >
            {
                !ctx.control_locked && <antd.Button
                    icon={<Icons.MdCast />}
                    shape="circle"

                />
            }

            {
                lyricsEnabled && <antd.Button
                    icon={<Icons.MdLyrics />}
                    shape="circle"
                    onClick={() => app.location.push("/lyrics")}
                />
            }

            {/* <antd.Button
                icon={<Icons.MdOfflineBolt />}
            >
                HyperDrive
            </antd.Button> */}

            <antd.Button
                icon={<Icons.X />}
                shape="circle"
                onClick={() => app.cores.player.close()}
            />
        </div>
        <div
            className={classnames(
                "toolbar_player"
            )}
        >
            <div
                className="toolbar_cover_background"
                style={{
                    backgroundImage: `url(${cover})`
                }}
            />

            <div
                className="toolbar_player_content"
                ref={contentRef}
            >
                <div className="toolbar_player_info">
                    <h1
                        ref={titleRef}
                        className={classnames(
                            "toolbar_player_info_title",
                            {
                                ["overflown"]: titleOverflown
                            }
                        )}
                    >
                        <ServiceIndicator
                            service={service}
                        />

                        {titleText}
                    </h1>

                    {
                        titleOverflown && <Marquee
                            gradientColor={RGBStringToValues(cover_analysis?.rgb)}
                            gradientWidth={20}
                            play={ctx.playback_status !== "stopped"}
                        >
                            <h1
                                className="toolbar_player_info_title"
                            >
                                <ServiceIndicator
                                    service={service}
                                />

                                {titleText}
                            </h1>
                        </Marquee>
                    }

                    <p className="toolbar_player_info_subtitle">
                        {artist ?? ""}
                    </p>
                </div>

                <div className="toolbar_player_actions">
                    <Controls />

                    <SeekBar
                        stopped={ctx.playback_status === "stopped"}
                        playing={ctx.playback_status === "playing"}
                        streamMode={ctx.livestream_mode}
                        disabled={ctx.control_locked}
                    />

                    <ExtraActions />
                </div>
            </div>
        </div>
    </div>
}

const PlayerContextHandler = () => {
    return <WithPlayerContext>
        <Player />
    </WithPlayerContext>
}

export default PlayerContextHandler