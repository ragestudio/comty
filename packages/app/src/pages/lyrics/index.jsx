import React from "react"
import classnames from "classnames"

import useMaxScreen from "@utils/useMaxScreen"
import { WithPlayerContext, Context } from "@contexts/WithPlayerContext"

import MusicService from "@models/music"

import PlayerController from "./components/controller"
import LyricsVideo from "./components/video"
import LyricsText from "./components/text"

import "./index.less"

const EnchancedLyrics = (props) => {
    const context = React.useContext(Context)
    const [lyrics, setLyrics] = React.useState(null)

    const videoRef = React.useRef()
    const textRef = React.useRef()

    async function loadLyrics(track_id) {
        const result = await MusicService.getTrackLyrics(track_id)

        if (result) {
            setLyrics(result)
        }
    }

    useMaxScreen()

    //* Handle when context change track_manifest
    React.useEffect(() => {
        if (context.track_manifest) {
            loadLyrics(context.track_manifest._id)
        }
    }, [context.track_manifest])

    //* Handle when lyrics data change
    React.useEffect(() => {
        console.log(lyrics)
    }, [lyrics])

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
        />

        <PlayerController

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