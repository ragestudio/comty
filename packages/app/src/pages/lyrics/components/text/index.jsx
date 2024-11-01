import React from "react"
import classnames from "classnames"
import { Motion, spring } from "react-motion"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

const LyricsText = React.forwardRef((props, textRef) => {
    const [playerState] = usePlayerStateContext()

    const { lyrics } = props

    const [syncInterval, setSyncInterval] = React.useState(null)
    const [currentLineIndex, setCurrentLineIndex] = React.useState(0)
    const [visible, setVisible] = React.useState(false)

    function syncPlayback() {
        if (!lyrics) {
            return false
        }

        const currentTrackTime = app.cores.player.controls.seek() * 1000

        const lineIndex = lyrics.synced_lyrics.findIndex((line) => {
            return currentTrackTime >= line.startTimeMs && currentTrackTime <= line.endTimeMs
        })

        if (lineIndex === -1) {
            if (!visible) {
                setVisible(false)
            }

            return false
        }

        const line = lyrics.synced_lyrics[lineIndex]

        setCurrentLineIndex(lineIndex)

        if (line.break) {
            return setVisible(false)
        }

        if (line.text) {
            return setVisible(true)
        }
    }

    function startSyncInterval() {
        setSyncInterval(setInterval(syncPlayback, 100))
    }

    //* Handle when current line index change
    React.useEffect(() => {
        if (currentLineIndex === 0) {
            setVisible(false)
        } else {
            setVisible(true)

            // find line element by id
            const lineElement = textRef.current.querySelector(`#lyrics-line-${currentLineIndex}`)

            // center scroll to current line
            if (lineElement) {
                lineElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                })
            } else {
                // scroll to top
                textRef.current.scrollTop = 0
            }
        }
    }, [currentLineIndex])

    //* Handle when playback status change
    React.useEffect(() => {
        if (typeof lyrics?.synced_lyrics !== "undefined") {
            if (playerState.playback_status === "playing") {
                startSyncInterval()
            } else {
                if (syncInterval) {
                    clearInterval(syncInterval)
                }
            }
        } else {
            clearInterval(syncInterval)
        }
    }, [playerState.playback_status])

    //* Handle when lyrics object change
    React.useEffect(() => {
        clearInterval(syncInterval)

        if (lyrics) {
            if (typeof lyrics?.synced_lyrics !== "undefined") {
                if (playerState.playback_status === "playing") {
                    startSyncInterval()
                }
            }
        }
    }, [lyrics])

    React.useEffect(() => {
        setVisible(false)
        clearInterval(syncInterval)
        setCurrentLineIndex(0)
    }, [playerState.track_manifest])

    React.useEffect(() => {
        return () => {
            clearInterval(syncInterval)
        }
    }, [])

    if (!lyrics?.synced_lyrics) {
        return null
    }

    return <div
        className="lyrics-text-wrapper"
    >
        <Motion
            style={{
                opacity: spring(visible ? 1 : 0),
            }}
        >
            {({ opacity }) => {
                return <div
                    ref={textRef}
                    className="lyrics-text"
                    style={{
                        opacity
                    }}
                >
                    {
                        lyrics.synced_lyrics.map((line, index) => {
                            return <p
                                key={index}
                                id={`lyrics-line-${index}`}
                                className={classnames(
                                    "line",
                                    {
                                        ["current"]: currentLineIndex === index
                                    }
                                )}
                            >
                                {line.text}
                            </p>
                        })
                    }
                </div>
            }}
        </Motion>
    </div>
})

export default LyricsText