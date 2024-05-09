import React from "react"

import { Context } from "@contexts/WithPlayerContext"

const maxLatencyInMs = 55

const LyricsVideo = React.forwardRef((props, videoRef) => {
    const context = React.useContext(Context)

    const { lyrics } = props

    const [syncInterval, setSyncInterval] = React.useState(null)
    const [syncingVideo, setSyncingVideo] = React.useState(false)
    const [currentVideoLatency, setCurrentVideoLatency] = React.useState(0)

    async function seekVideoToSyncAudio() {
        if (lyrics) {
            if (lyrics.video_source && typeof lyrics.sync_audio_at_ms !== "undefined") {
                const currentTrackTime = app.cores.player.seek()

                setSyncingVideo(true)

                videoRef.current.currentTime = currentTrackTime + (lyrics.sync_audio_at_ms / 1000) + app.cores.player.gradualFadeMs / 1000
            }
        }
    }

    async function syncPlayback() {
        if (!lyrics) {
            return false
        }

        // if `sync_audio_at_ms` is present, it means the video must be synced with audio
        if (lyrics.video_source && typeof lyrics.sync_audio_at_ms !== "undefined") {
            const currentTrackTime = app.cores.player.seek()
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
        setSyncInterval(setInterval(syncPlayback, 100))
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
        if (typeof lyrics?.sync_audio_at_ms !== "undefined") {
            if (context.playback_status === "playing") {
                videoRef.current.play()

                setSyncInterval(setInterval(syncPlayback, 500))
            } else {
                videoRef.current.pause()

                if (syncInterval) {
                    clearInterval(syncInterval)
                }
            }
        }
    }, [context.playback_status])

    //* Handle when lyrics object change
    React.useEffect(() => {
        if (lyrics) {
            clearInterval(syncInterval)
            setCurrentVideoLatency(0)
            setSyncingVideo(false)

            if (lyrics.video_source) {
                videoRef.current.src = lyrics.video_source

                videoRef.current.load()

                if (typeof lyrics.sync_audio_at_ms !== "undefined") {
                    videoRef.current.currentTime = lyrics.sync_audio_at_ms / 1000

                    if (context.playback_status === "playing") {
                        videoRef.current.play()
                        startSyncInterval()
                    } else {
                        videoRef.current.pause()
                    }

                    const currentTime = app.cores.player.seek()

                    if (currentTime > 0) {
                        seekVideoToSyncAudio()
                    }
                } else {
                    videoRef.current.loop = true
                    videoRef.current.play()
                }
            }
        }
    }, [lyrics])

    React.useEffect(() => {
        clearInterval(syncInterval)

        return () => {
            clearInterval(syncInterval)
        }
    }, [])

    return <>
        <div className="videoDebugOverlay">
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

        <video
            className="lyrics-video"
            ref={videoRef}
            controls={false}
            muted
            preload="auto"
        />
    </>
})

export default LyricsVideo