import React from "react"
import classnames from "classnames"
import { Motion, spring } from "react-motion"

import { Context } from "@contexts/WithPlayerContext"

const LyricsText = React.forwardRef((props, textRef) => {
    const context = React.useContext(Context)

    const { lyrics } = props

    const [syncInterval, setSyncInterval] = React.useState(null)
    const [currentLineIndex, setCurrentLineIndex] = React.useState(0)
    const [visible, setVisible] = React.useState(false)

    function syncPlayback() {
        if (!lyrics) {
            return false
        }

        const currentTrackTime = app.cores.player.seek() * 1000

        const lineIndex = lyrics.lrc.findIndex((line) => {
            return currentTrackTime >= line.startTimeMs && currentTrackTime <= line.endTimeMs
        })

        if (lineIndex === -1) {
            if (!visible) {
                setVisible(false)
            }

            return false
        }

        const line = lyrics.lrc[lineIndex]

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
            // find line element by id
            const lineElement = textRef.current.querySelector(`#lyrics-line-${currentLineIndex}`)

            // center scroll to current line
            if (lineElement) {
                lineElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                })
            }
        }
    }, [currentLineIndex])

    //* Handle when playback status change
    React.useEffect(() => {
        if (lyrics) {
            if (typeof lyrics?.lrc !== "undefined") {
                if (context.playback_status === "playing") {
                    startSyncInterval()
                } else {
                    if (syncInterval) {
                        clearInterval(syncInterval)
                    }
                } startSyncInterval()
            }
        }

    }, [context.playback_status])

    //* Handle when lyrics object change
    React.useEffect(() => {
        clearInterval(syncInterval)

        if (lyrics) {
            if (typeof lyrics?.lrc !== "undefined") {
                if (context.playback_status === "playing") {
                    startSyncInterval()
                }
            }
        }
    }, [lyrics])

    React.useEffect(() => {
        return () => {
            clearInterval(syncInterval)
        }
    }, [])

    if (!lyrics?.lrc) {
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
                        lyrics.lrc.map((line, index) => {
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