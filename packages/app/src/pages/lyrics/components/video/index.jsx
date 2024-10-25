import React from "react"
import HLS from "hls.js"

import classnames from "classnames"
import { usePlayerStateContext } from "@contexts/WithPlayerContext"

const maxLatencyInMs = 55

const LyricsVideo = React.forwardRef((props, videoRef) => {
    const playerState = usePlayerStateContext()

    const { lyrics } = props

    const [syncInterval, setSyncInterval] = React.useState(null)
    const [syncingVideo, setSyncingVideo] = React.useState(false)
    const [currentVideoLatency, setCurrentVideoLatency] = React.useState(0)
    const hls = React.useRef(new HLS())

    async function seekVideoToSyncAudio() {
        if (!lyrics) {
            return null
        }

        if (!lyrics.video_source || typeof lyrics.sync_audio_at_ms === "undefined") {
            return null
        }

        const currentTrackTime = app.cores.player.controls.seek()

        setSyncingVideo(true)

        videoRef.current.currentTime = currentTrackTime + (lyrics.sync_audio_at_ms / 1000) + app.cores.player.gradualFadeMs / 1000
    }

    async function syncPlayback() {
        if (!lyrics) {
            return false
        }

        // if `sync_audio_at_ms` is present, it means the video must be synced with audio
        if (lyrics.video_source && typeof lyrics.sync_audio_at_ms !== "undefined") {
            if (!videoRef.current) {
                clearInterval(syncInterval)
                setSyncInterval(null)
                setCurrentVideoLatency(0)
                return false
            }

            const currentTrackTime = app.cores.player.controls.seek()
            const currentVideoTime = videoRef.current.currentTime - (lyrics.sync_audio_at_ms / 1000)

            //console.log(`Current track time: ${currentTrackTime}, current video time: ${currentVideoTime}`)

            const maxOffset = maxLatencyInMs / 1000
            const currentVideoTimeDiff = Math.abs(currentVideoTime - currentTrackTime)

            setCurrentVideoLatency(currentVideoTimeDiff)

            if (syncingVideo === true) {
                console.log(`Syncing video...`)
                return false
            }

            if (currentVideoTimeDiff > maxOffset) {
                console.warn(`Video offset exceeds`, maxOffset)
                seekVideoToSyncAudio()
            }
        }
    }

    function startSyncInterval() {
        setSyncInterval(setInterval(syncPlayback, 300))
    }

    React.useEffect(() => {
        videoRef.current.addEventListener("seeked", (event) => {
            setSyncingVideo(false)
        })

        // videoRef.current.addEventListener("error", (event) => {
        //     console.log("Failed to load", event)
        // })

        // videoRef.current.addEventListener("ended", (event) => {
        //     console.log("Video ended", event)
        // })

        // videoRef.current.addEventListener("stalled", (event) => {
        //     console.log("Failed to fetch data, but trying")
        // })

        // videoRef.current.addEventListener("waiting", (event) => {
        //     console.log("Waiting for data...")
        // })
    }, [])

    //* Handle when playback status change
    React.useEffect(() => {
        if (lyrics?.video_source && typeof lyrics?.sync_audio_at_ms !== "undefined") {
            if (playerState.playback_status === "playing") {
                videoRef.current.play()

                setSyncInterval(setInterval(syncPlayback, 500))
            } else {
                videoRef.current.pause()

                if (syncInterval) {
                    clearInterval(syncInterval)
                }
            }
        }
    }, [playerState.playback_status])

    React.useEffect(() => {
        if (lyrics?.video_source && playerState.loading === true && playerState.playback_status === "playing") {
            videoRef.current.pause()
        }

        if (lyrics?.video_source && playerState.loading === false && playerState.playback_status === "playing") {
            videoRef.current.play()
        }
    }, [playerState.loading])

    //* Handle when lyrics object change
    React.useEffect(() => {
        clearInterval(syncInterval)
        setCurrentVideoLatency(0)
        setSyncingVideo(false)

        if (lyrics) {
            if (lyrics.video_source) {
                hls.current.loadSource(lyrics.video_source)

                if (typeof lyrics.sync_audio_at_ms !== "undefined") {
                    videoRef.current.currentTime = lyrics.sync_audio_at_ms / 1000

                    if (playerState.playback_status === "playing") {
                        videoRef.current.play()
                        startSyncInterval()
                    } else {
                        videoRef.current.pause()
                    }

                    const currentTime = app.cores.player.controls.seek()

                    if (currentTime > 0) {
                        seekVideoToSyncAudio()
                    }
                } else {
                    videoRef.current.loop = true
                    videoRef.current.play()
                }
            } else {
                videoRef.current
            }
        } else {
            videoRef.current
        }
    }, [lyrics])

    React.useEffect(() => {
        clearInterval(syncInterval)

        hls.current.attachMedia(videoRef.current)

        return () => {
            clearInterval(syncInterval)
        }
    }, [])

    return <>
        {
            props.lyrics?.sync_audio_at && <div
                className={classnames(
                    "videoDebugOverlay",
                )}
            >
                <div>
                    <p>Maximun latency</p>
                    <p>{maxLatencyInMs}ms</p>
                </div>
                <div>
                    <p>Video Latency</p>
                    <p>{(currentVideoLatency * 1000).toFixed(2)}ms</p>
                </div>
                {syncingVideo ? <p>Syncing video...</p> : null}
            </div>
        }

        <video
            className={classnames(
                "lyrics-video",
                {
                    ["hidden"]: !lyrics || !lyrics?.video_source
                }
            )}
            ref={videoRef}
            controls={false}
            muted
            preload="auto"
        />
    </>
})

export default LyricsVideo