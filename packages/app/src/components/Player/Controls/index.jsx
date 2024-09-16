import React from "react"
import * as antd from "antd"

import UseAnimations from "react-useanimations"
import LoadingAnimation from "react-useanimations/lib/loading"

import { Icons } from "@components/Icons"
import LikeButton from "@components/LikeButton"
import AudioVolume from "@components/Player/AudioVolume"
import AudioPlayerChangeModeButton from "@components/Player/ChangeModeButton"

import { Context } from "@contexts/WithPlayerContext"

import "./index.less"

const EventsHandlers = {
    "playback": () => {
        return app.cores.player.playback.toggle()
    },
    "like": async (ctx) => {
        await app.cores.player.toggleCurrentTrackLike(!ctx.track_manifest?.liked)
    },
    "previous": () => {
        return app.cores.player.playback.previous()
    },
    "next": () => {
        return app.cores.player.playback.next()
    },
    "volume": (ctx, value) => {
        return app.cores.player.volume(value)
    },
    "mute": () => {
        return app.cores.player.toggleMute()
    }
}

const Controls = (props) => {
    try {
        const ctx = React.useContext(Context)

        const handleAction = (event, ...args) => {
            if (typeof EventsHandlers[event] !== "function") {
                throw new Error(`Unknown event "${event}"`)
            }

            return EventsHandlers[event](ctx, ...args)
        }

        return <div
            className={
                props.className ?? "player-controls"
            }
        >
            <AudioPlayerChangeModeButton
                disabled={ctx.control_locked}
            />
            <antd.Button
                type="ghost"
                shape="round"
                icon={<Icons.FiChevronLeft />}
                onClick={() => handleAction("previous")}
                disabled={ctx.control_locked}
            />
            <antd.Button
                type="primary"
                shape="circle"
                icon={ctx.livestream_mode ? <Icons.MdStop /> : ctx.playback_status === "playing" ? <Icons.MdPause /> : <Icons.MdPlayArrow />}
                onClick={() => handleAction("playback")}
                className="playButton"
                disabled={ctx.control_locked}
            >
                {
                    ctx.loading && <div className="loadCircle">
                        <UseAnimations
                            animation={LoadingAnimation}
                            size="100%"
                        />
                    </div>
                }
            </antd.Button>
            <antd.Button
                type="ghost"
                shape="round"
                icon={<Icons.FiChevronRight />}
                onClick={() => handleAction("next")}
                disabled={ctx.control_locked}
            />
            {
                app.isMobile && <LikeButton
                    onClick={() => handleAction("like")}
                    liked={ctx.track_manifest?.liked}
                />
            }
            {
                !app.isMobile && <antd.Popover
                    content={React.createElement(
                        AudioVolume,
                        {
                            onChange: (value) => handleAction("volume", value),
                            defaultValue: ctx.volume
                        }
                    )}
                    trigger="hover"
                >
                    <button
                        className="muteButton"
                        onClick={() => handleAction("mute")}
                    >
                        {
                            ctx.muted
                                ? <Icons.FiVolumeX />
                                : <Icons.FiVolume2 />
                        }
                    </button>
                </antd.Popover>
            }
        </div>
    } catch (error) {
        console.error(error)
        return null
    }
}

export default Controls