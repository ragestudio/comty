import React from "react"
import classnames from "classnames"

import useMaxScreen from "@hooks/useMaxScreen"
import { WithPlayerContext, Context } from "@contexts/WithPlayerContext"

import MusicService from "@models/music"

import PlayerController from "./components/controller"
import LyricsVideo from "./components/video"
import LyricsText from "./components/text"

import "./index.less"

const EnchancedLyrics = (props) => {
    const context = React.useContext(Context)

    const [initialized, setInitialized] = React.useState(false)
    const [lyrics, setLyrics] = React.useState(null)
    const [translationEnabled, setTranslationEnabled] = React.useState(false)

    const videoRef = React.useRef()
    const textRef = React.useRef()

    async function loadLyrics(track_id) {
        const result = await MusicService.getTrackLyrics(track_id, {
            preferTranslation: translationEnabled,
        })

        if (result) {
            setLyrics(result)
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
            loadLyrics(context.track_manifest._id)
        }
    }, [translationEnabled])

    //* Handle when context change track_manifest
    React.useEffect(() => {
        setLyrics(null)
        
        if (context.track_manifest) {
            loadLyrics(context.track_manifest._id)
        }
    }, [context.track_manifest])

    //* Handle when lyrics data change
    React.useEffect(() => {
        console.log(lyrics)
    }, [lyrics])

    React.useEffect(() => {
        setInitialized(true)
    }, [])

    return <div
        className={classnames(
            "lyrics",
            {
                ["stopped"]: context.playback_status !== "playing",
            }
        )}
    >
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

const EnchancedLyricsPage = (props) => {
    return <WithPlayerContext>
        <EnchancedLyrics
            {...props}
        />
    </WithPlayerContext>
}

export default EnchancedLyricsPage