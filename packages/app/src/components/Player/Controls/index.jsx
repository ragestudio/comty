import React from "react"
import * as antd from "antd"

import UseAnimations from "react-useanimations"
import LoadingAnimation from "react-useanimations/lib/loading"

import { Icons } from "components/Icons"

import AudioVolume from "components/Player/AudioVolume"
import AudioPlayerChangeModeButton from "components/Player/ChangeModeButton"

import "./index.less"

export default ({
    className,
    controls,
    syncModeLocked = false,
    syncMode = false,
    streamMode,
    playbackStatus,
    onVolumeUpdate,
    onMuteUpdate,
    audioVolume = 0.3,
    audioMuted = false,
    loading = false,
} = {}) => {
    const onClickActionsButton = (event) => {
        if (typeof controls !== "object") {
            console.warn("[AudioPlayer] onClickActionsButton: props.controls is not an object")

            return false
        }

        if (typeof controls[event] !== "function") {
            console.warn(`[AudioPlayer] onClickActionsButton: ${event} is not a function`)

            return false
        }

        return controls[event]()
    }

    return <div
        className={
            className ?? "player-controls"
        }
    >
        <AudioPlayerChangeModeButton
            disabled={syncModeLocked}
        />
        <antd.Button
            type="ghost"
            shape="round"
            icon={<Icons.ChevronLeft />}
            onClick={() => onClickActionsButton("previous")}
            disabled={syncModeLocked}
        />
        <antd.Button
            type="primary"
            shape="circle"
            icon={streamMode ? <Icons.MdStop /> : playbackStatus === "playing" ? <Icons.MdPause /> : <Icons.MdPlayArrow />}
            onClick={() => onClickActionsButton("toggle")}
            className="playButton"
            disabled={syncModeLocked}
        >
            {
                loading && <div className="loadCircle">
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
            icon={<Icons.ChevronRight />}
            onClick={() => onClickActionsButton("next")}
            disabled={syncModeLocked}
        />
        {
            !app.isMobile && <antd.Popover
                content={React.createElement(
                    AudioVolume,
                    { onChange: onVolumeUpdate, defaultValue: audioVolume }
                )}
                trigger="hover"
            >
                <div
                    className="muteButton"
                    onClick={onMuteUpdate}
                >
                    {
                        audioMuted
                            ? <Icons.VolumeX />
                            : <Icons.Volume2 />
                    }
                </div>
            </antd.Popover>
        }
    </div>
}