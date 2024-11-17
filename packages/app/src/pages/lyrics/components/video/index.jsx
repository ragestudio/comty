import React from "react"
import HLS from "hls.js"

import classnames from "classnames"
import { usePlayerStateContext } from "@contexts/WithPlayerContext"

const maxLatencyInMs = 55

const LyricsVideo = React.forwardRef((props, videoRef) => {
    const [playerState] = usePlayerStateContext()

    const { lyrics } = props

    const [initialLoading, setInitialLoading] = React.useState(true)
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

        let newTime = currentTrackTime + (lyrics.sync_audio_at_ms / 1000) + app.cores.player.gradualFadeMs / 1000

        // dec some ms to ensure the video seeks correctly
        newTime -= 5 / 1000

        videoRef.current.currentTime = newTime
    }

    async function syncPlayback() {
        // if something is wrong, stop syncing
        if (videoRef.current === null || !lyrics || !lyrics.video_source || typeof lyrics.sync_audio_at_ms === "undefined" || playerState.playback_status !== "playing") {
            return stopSyncInterval()
        }

        const currentTrackTime = app.cores.player.controls.seek()
        const currentVideoTime = videoRef.current.currentTime - (lyrics.sync_audio_at_ms / 1000)

        //console.log(`Current track time: ${currentTrackTime}, current video time: ${currentVideoTime}`)

        const maxOffset = maxLatencyInMs / 1000
        const currentVideoTimeDiff = Math.abs(currentVideoTime - currentTrackTime)

        setCurrentVideoLatency(currentVideoTimeDiff)

        if (syncingVideo === true) {
            return false
        }

        if (currentVideoTimeDiff > maxOffset) {
            seekVideoToSyncAudio()
        }
    }

    function startSyncInterval() {
        setSyncInterval(setInterval(syncPlayback, 300))
    }

    function stopSyncInterval() {
        setSyncingVideo(false)
        setSyncInterval(null)
        clearInterval(syncInterval)
    }

    //* handle when player is loading
    React.useEffect(() => {
        if (lyrics?.video_source && playerState.loading === true && playerState.playback_status === "playing") {
            videoRef.current.pause()
        }

        if (lyrics?.video_source && playerState.loading === false && playerState.playback_status === "playing") {
            videoRef.current.play()
        }
    }, [playerState.loading])

    //* Handle when playback status change
    React.useEffect(() => {
        if (initialLoading === false) {
            console.log(`VIDEO:: Playback status changed to ${playerState.playback_status}`)

            if (lyrics && lyrics.video_source) {
                if (playerState.playback_status === "playing") {
                    videoRef.current.play()
                    startSyncInterval()
                } else {
                    videoRef.current.pause()
                    stopSyncInterval()
                }
            }
        }
    }, [playerState.playback_status])

    //* Handle when lyrics object change
    React.useEffect(() => {
        setCurrentVideoLatency(0)
        stopSyncInterval()

        if (lyrics) {
            if (lyrics.video_source) {
                console.log("Loading video source >", lyrics.video_source)
                hls.current.loadSource(lyrics.video_source)

                if (typeof lyrics.sync_audio_at_ms !== "undefined") {
                    videoRef.current.loop = false
                    videoRef.current.currentTime = lyrics.sync_audio_at_ms / 1000

                    startSyncInterval()
                } else {
                    videoRef.current.loop = true
                    videoRef.current.currentTime = 0
                }

                if (playerState.playback_status === "playing"){
                    videoRef.current.play()
                }
            }
        }

        setInitialLoading(false)
    }, [lyrics])

    React.useEffect(() => {
        videoRef.current.addEventListener("seeked", (event) => {
            setSyncingVideo(false)
        })

        hls.current.attachMedia(videoRef.current)

        return () => {
            stopSyncInterval()
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