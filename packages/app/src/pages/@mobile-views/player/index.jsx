import React from "react"
import { Button } from "antd"
import { Icons } from "components/Icons"
import classnames from "classnames"
import RGBStringToValues from "utils/rgbToValues"

import SeekBar from "components/Player/SeekBar"
import Controls from "components/Player/Controls"
import { WithPlayerContext, Context } from "contexts/WithPlayerContext"

import ExtraActions from "components/Player/ExtraActions"

import "./index.less"

const ServiceIndicator = (props) => {
    if (!props.service) {
        return null
    }

    switch (props.service) {
        case "tidal": {
            return <div className="service_indicator">
                <Icons.SiTidal /> Playing from Tidal
            </div>
        }
        default: {
            return null
        }
    }
}

const AudioPlayer = (props) => {
    return <WithPlayerContext>
        <AudioPlayerComponent
            {...props}
        />
    </WithPlayerContext>
}

const AudioPlayerComponent = (props) => {
    const ctx = React.useContext(Context)

    React.useEffect(() => {
        if (app.currentDragger) {
            app.currentDragger.setBackgroundColorValues(RGBStringToValues(ctx.track_manifest?.cover_analysis?.rgb))
        }

    }, [ctx.track_manifest?.cover_analysis])

    const {
        title,
        album,
        artist,
        service,
        lyricsEnabled,
        cover_analysis,
        cover,
    } = ctx.track_manifest ?? {}

    const playing = ctx.playback_status === "playing"
    const stopped = ctx.playback_status === "stopped"

    const titleText = (!playing && stopped) ? "Stopped" : (title ?? "Untitled")
    const subtitleText = `${artist} | ${album?.title ?? album}`

    return <div
        className={classnames(
            "mobile_media_player_wrapper",
            {
                "cover_light": cover_analysis?.isLight,
            }
        )}
        style={{
            "--cover_isLight": cover_analysis?.isLight,
        }}
    >
        <div className="mobile_media_player">
            <ServiceIndicator
                service={service}
            />

            <div
                className="cover"
                style={{
                    backgroundImage: `url(${cover ?? "/assets/no_song.png"})`,
                }}
            />

            <div className="header">
                <div className="info">
                    <div className="title">
                        <h2>
                            {
                                titleText
                            }
                        </h2>
                    </div>
                    <div className="subTitle">
                        <div className="artist">
                            <h3>
                                {subtitleText}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <Controls />

            <SeekBar
                stopped={ctx.playback_status === "stopped"}
                playing={ctx.playback_status === "playing"}
                streamMode={ctx.livestream_mode}
                disabled={ctx.control_locked}
            />

            <ExtraActions />
        </div>
    </div>
}

export default AudioPlayer