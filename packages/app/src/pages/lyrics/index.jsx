import React from "react"
import classnames from "classnames"

import useMaxScreen from "@hooks/useMaxScreen"
import { usePlayerStateContext } from "@contexts/WithPlayerContext"

import MusicService from "@models/music"

import PlayerController from "./components/controller"
import LyricsVideo from "./components/video"
import LyricsText from "./components/text"

import "./index.less"

function getDominantColorStr(track_manifest) {
    if (!track_manifest) {
        return `0,0,0`
    }

    const values = track_manifest.cover_analysis?.value ?? [0, 0, 0]

    return `${values[0]}, ${values[1]}, ${values[2]}`
}

const EnchancedLyricsPage = () => {
    const [playerState] = usePlayerStateContext()

    const [initialized, setInitialized] = React.useState(false)
    const [lyrics, setLyrics] = React.useState(null)
    const [translationEnabled, setTranslationEnabled] = React.useState(false)

    const videoRef = React.useRef()
    const textRef = React.useRef()

    async function loadLyrics(track_id) {
        const result = await MusicService.getTrackLyrics(track_id, {
            preferTranslation: translationEnabled,
        }).catch((err) => {
            return null
        })

        if (result) {
            setLyrics(result)
        } else {
            setLyrics(false)
        }
    }

    async function toggleTranslationEnabled(to) {
        setTranslationEnabled((prev) => {
            return to ?? !prev
        })
    }

    useMaxScreen()

    React.useEffect((prev) => {
        if (initialized) {
            loadLyrics(playerState.track_manifest._id)
        }
    }, [translationEnabled])

    //* Handle when context change track_manifest
    React.useEffect(() => {
        if (playerState.track_manifest) {
            if (!lyrics || (lyrics.track_id !== playerState.track_manifest._id)) {
                loadLyrics(playerState.track_manifest._id)
            }
        } else {
            setLyrics(null)
        }
    }, [playerState.track_manifest])

    React.useEffect(() => {
        setInitialized(true)
    }, [])

    return <div
        className={classnames(
            "lyrics",
            {
                ["stopped"]: playerState.playback_status !== "playing",
            }
        )}
        style={{
            "--dominant-color": getDominantColorStr(playerState.track_manifest)
        }}
    >
        <div
            className="lyrics-background-color"
        />

        {
            playerState.track_manifest && !lyrics?.video_source && <div
                className="lyrics-background-wrapper"
            >

                <div
                    className="lyrics-background-cover"
                >
                    <img
                        src={playerState.track_manifest.cover}
                    />
                </div>
            </div>
        }

        <LyricsVideo
            ref={videoRef}
            lyrics={lyrics}
        />

        <LyricsText
            ref={textRef}
            lyrics={lyrics}
            translationEnabled={translationEnabled}
        />

        <PlayerController
            lyrics={lyrics}
            translationEnabled={translationEnabled}
            toggleTranslationEnabled={toggleTranslationEnabled}
        />
    </div>
}

export default EnchancedLyricsPage