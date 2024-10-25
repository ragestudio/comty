import React from "react"
import HLS from "hls.js"
import Plyr from "plyr"

import "plyr-react/dist/plyr.css"

import "./index.less"

const VideoPlayer = (props) => {
    const videoRef = React.createRef()

    const [initializing, setInitializing] = React.useState(true)
    const [player, setPlayer] = React.useState(null)
    const [hls, setHls] = React.useState(null)

    React.useEffect(() => {
        setInitializing(true)

        const hlsInstance = new HLS()
        const plyrInstance = new Plyr(videoRef.current, {
            controls: props.controls ?? [
                "current-time",
                "mute",
                "volume",
                "captions",
                "settings",
                "pip",
                "airplay",
                "fullscreen"
            ],
            settings: ["quality", "speed"],
            quality: {
                default: 1080,
                options: [
                    { label: "Auto", value: "auto" },
                    { label: "1080p", value: 1080 },
                    { label: "720p", value: 720 },
                    { label: "480p", value: 480 },
                    { label: "360p", value: 360 },
                    { label: "240p", value: 240 },
                ]
            }
        })

        setHls(hlsInstance)
        setPlayer(plyrInstance)

        hlsInstance.attachMedia(videoRef.current)
        hlsInstance.loadSource(props.src)

        hlsInstance.on(HLS.Events.MANIFEST_PARSED, (event, data) => {
            console.log(event, data)

            plyrInstance.set
        })

        setInitializing(false)

        return () => {
            hlsInstance.destroy()
        }
    }, [])

    React.useEffect(() => {
        if (hls) {
            hls.loadSource(props.src)
        }
    }, [props.src])

    return <div className="video-player">
        <video
            ref={videoRef}
            className="video-player-component"
            controls={props.controls}
        />
    </div>
}

export default VideoPlayer