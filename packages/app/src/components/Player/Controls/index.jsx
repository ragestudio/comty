import React from "react"
import * as antd from "antd"

import UseAnimations from "react-useanimations"
import LoadingAnimation from "react-useanimations/lib/loading"

import { Icons } from "@components/Icons"
import LikeButton from "@components/LikeButton"
import AudioVolume from "@components/Player/AudioVolume"
import AudioPlayerChangeModeButton from "@components/Player/ChangeModeButton"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

import "./index.less"

const EventsHandlers = {
    "playback": () => {
        return app.cores.player.playback.toggle()
    },
    "previous": () => {
        return app.cores.player.playback.previous()
    },
    "next": () => {
        return app.cores.player.playback.next()
    },
    "volume": (ctx, value) => {
        return app.cores.player.controls.volume(value)
    },
    "mute": () => {
        return app.cores.player.controls.mute("toggle")
    },
    "like": async (ctx) => {
        if (!ctx.track_manifest) {
            return false
        }

        const track = app.cores.player.track()

        return await track.manifest.serviceOperations.toggleItemFavourite("track", ctx.track_manifest._id)
    },
}

const Controls = (props) => {
    const [playerState] = usePlayerStateContext()

    const handleAction = (event, ...args) => {
        if (typeof EventsHandlers[event] !== "function") {
            throw new Error(`Unknown event "${event}"`)
        }

        return EventsHandlers[event](playerState, ...args)
    }

    return <div
        className={
            props.className ?? "player-controls"
        }
    >
        <AudioPlayerChangeModeButton
            disabled={playerState.control_locked}
        />
        <antd.Button
            type="ghost"
            shape="round"
            icon={<Icons.FiChevronLeft />}
            onClick={() => handleAction("previous")}
            disabled={playerState.control_locked}
        />
        <antd.Button
            type="primary"
            shape="circle"
            icon={playerState.livestream_mode ? <Icons.MdStop /> : playerState.playback_status === "playing" ? <Icons.MdPause /> : <Icons.MdPlayArrow />}
            onClick={() => handleAction("playback")}
            className="playButton"
            disabled={playerState.control_locked}
        >
            {
                playerState.loading && <div className="loadCircle">
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
            disabled={playerState.control_locked}
        />
        {
            !app.isMobile && <antd.Popover
                content={React.createElement(
                    AudioVolume,
                    {
                        onChange: (value) => handleAction("volume", value),
                        defaultValue: playerState.volume
                    }
                )}
                trigger="hover"
            >
                <button
                    className="muteButton"
                    onClick={() => handleAction("mute")}
                >
                    {
                        playerState.muted
                            ? <Icons.FiVolumeX />
                            : <Icons.FiVolume2 />
                    }
                </button>
            </antd.Popover>
        }

        {
            app.isMobile && <LikeButton
                liked={playerState.track_manifest?.serviceOperations.fetchLikeStatus}
                onClick={() => handleAction("like")}
            />
        }
    </div>
}

export default Controls