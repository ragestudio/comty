import React from "react"
import Ticker from "react-ticker"
import { FastAverageColor } from "fast-average-color"
import classnames from "classnames"
import { Icons } from "components/Icons"

import "./index.less"

const useEventBus = (events) => {
    const registerEvents = () => {
        for (const [event, handler] of Object.entries(events)) {
            app.eventBus.on(event, handler)
        }
    }

    const unregisterEvents = () => {
        for (const [event, handler] of Object.entries(events)) {
            app.eventBus.off(event, handler)
        }
    }

    React.useEffect(() => {
        registerEvents()

        return () => {
            unregisterEvents()
        }
    }, [])
}

const fac = new FastAverageColor()

const bruh = (props) => {
    const [thumbnailAnalysis, setThumbnailAnalysis] = React.useState("#000000")
    const [currentPlaying, setCurrentPlaying] = React.useState(app.cores.player.getState("currentAudioManifest"))
    const [plabackState, setPlaybackState] = React.useState(app.cores.player.getState("playbackStatus") ?? "stopped")

    const onClickMinimize = () => {
        app.cores.player.minimize()
    }

    const calculateAverageCoverColor = async () => {
        if (currentPlaying) {
            const color = await fac.getColorAsync(currentPlaying.thumbnail)
            setThumbnailAnalysis(color)
            updateBackgroundItem(color)
        }
    }

    const updateBackgroundItem = () => {
        app.SidebarController.updateBackgroundItem(undefined, {
            icon: <Icons.MdMusicNote />,
            style: {
                backgroundColor: thumbnailAnalysis?.hex
            }
        })
    }

    useEventBus({
        "player.current.update": (data) => {
            console.log("player.current.update", data)
            setCurrentPlaying(data)
            updateBackgroundItem()
        },
        "player.playback.update": (data) => {
            setPlaybackState(data)
            updateBackgroundItem()
        }
    })

    React.useEffect(() => {
        calculateAverageCoverColor()
    }, [currentPlaying])

    React.useEffect(() => {

    }, [])

    return <div
        className="background_media_player"
        onClick={onClickMinimize}
    >
        {
            currentPlaying && <div
                className={classnames(
                    "background_media_player__title",
                    {
                        ["lightBackground"]: thumbnailAnalysis.isLight,
                    }
                )}
            >
                <h4>
                    {currentPlaying.title} - {currentPlaying.artist}
                </h4>
            </div>
        }
    </div>
}

export default class BackgroundMediaPlayer extends React.Component {
    state = {
        thumbnailAnalysis: null,
        currentPlaying: app.cores.player.getState("currentAudioManifest"),
        plabackState: app.cores.player.getState("playbackStatus") ?? "stopped",
    }

    events = {
        "player.current.update": (data) => {
            this.calculateAverageCoverColor()

            this.setState({
                currentPlaying: data
            })
        },
        "player.playback.update": (data) => {
            this.updateBackgroundItem()

            this.setState({
                plabackState: data
            })
        }
    }

    onClickMinimize = () => {
        app.cores.player.minimize()
    }

    calculateAverageCoverColor = async () => {
        if (this.state.currentPlaying) {
            const color = await fac.getColorAsync(this.state.currentPlaying.thumbnail)

            this.setState({
                thumbnailAnalysis: color
            })

            this.updateBackgroundItem(color)
        }
    }

    updateBackgroundItem = (analysis) => {
        app.SidebarController.updateBackgroundItem(undefined, {
            icon: <Icons.MdMusicNote />,
            style: {
                backgroundColor: analysis?.hex ?? this.state.thumbnailAnalysis?.hex,
            }
        })
    }

    componentDidMount = async () => {
        this.calculateAverageCoverColor()

        for (const [event, handler] of Object.entries(this.events)) {
            app.eventBus.on(event, handler)
        }
    }

    componentWillUnmount() {
        for (const [event, handler] of Object.entries(this.events)) {
            app.eventBus.off(event, handler)
        }
    }

    render() {
        return <div
            className="background_media_player"
            onClick={this.onClickMinimize}
        >
            {
                this.state.currentPlaying && <div
                    className={classnames(
                        "background_media_player__title",
                        {
                            ["lightBackground"]: this.state.thumbnailAnalysis?.isLight,
                        }
                    )}
                >
                    <h4>
                        {this.state.currentPlaying?.title} - {this.state.currentPlaying?.artist}
                    </h4>
                </div>
            }
        </div>
    }
}