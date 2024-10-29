import React from "react"
import * as antd from "antd"
import Marquee from "react-fast-marquee"
import classnames from "classnames"

import { Icons } from "@components/Icons"
import { usePlayerStateContext } from "@contexts/WithPlayerContext"
import SeekBar from "@components/Player/SeekBar"
import Controls from "@components/Player/Controls"

import RGBStringToValues from "@utils/rgbToValues"

import ExtraActions from "../ExtraActions"

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

const Player = (props) => {
    const [playerState] = usePlayerStateContext()

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
        artistStr,
        liked,
        service,
        lyrics_enabled,
        cover_analysis,
        cover,
    } = playerState.track_manifest ?? {}

    const playing = playerState.playback_status === "playing"
    const stopped = playerState.playback_status === "stopped"

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
                "minimized": playerState.minimized,
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
                !playerState.control_locked && <antd.Button
                    icon={<Icons.MdCast />}
                    shape="circle"

                />
            }

            {
                lyrics_enabled && <antd.Button
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
                icon={<Icons.FiX />}
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
                            play={playerState.playback_status !== "stopped"}
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
                        {artistStr ?? ""}
                    </p>
                </div>

                <div className="toolbar_player_actions">
                    <Controls />

                    <SeekBar
                        stopped={playerState.playback_status === "stopped"}
                        playing={playerState.playback_status === "playing"}
                        streamMode={playerState.livestream_mode}
                        disabled={playerState.control_locked}
                    />

                    <ExtraActions />
                </div>
            </div>
        </div>
    </div>
}

export default Player