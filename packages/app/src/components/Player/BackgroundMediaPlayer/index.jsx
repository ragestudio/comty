import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Icons } from "components/Icons"
import Marquee from "react-fast-marquee"

import "./index.less"

function RGBStringToValues(rgbString) {
    if (!rgbString) {
        return [0, 0, 0]
    }

    const rgb = rgbString.replace("rgb(", "").replace(")", "").split(",").map((v) => parseInt(v))

    return [rgb[0], rgb[1], rgb[2]]
}

export default class BackgroundMediaPlayer extends React.Component {
    state = {
        thumbnailAnalysis: app.cores.player.getState("coverColorAnalysis"),
        currentPlaying: app.cores.player.getState("currentAudioManifest"),
        plabackState: app.cores.player.getState("playbackStatus") ?? "stopped",
        expanded: false,
    }

    events = {
        "player.coverColorAnalysis.update": (data) => {
            this.setState({
                thumbnailAnalysis: data
            })
        },
        "player.current.update": (data) => {
            this.setState({
                currentPlaying: data
            })
        },
        "player.status.update": (data) => {
            this.setState({
                plabackState: data
            })
        },
        "sidebar.expanded": (to) => {
            if (!to) {
                this.toogleExpand(false)
            }
        }
    }

    onClickMinimize = () => {
        app.cores.player.minimize()
    }

    toogleExpand = (to) => {
        if (typeof to !== "boolean") {
            to = !this.state.expanded
        }

        this.setState({
            expanded: to
        })
    }

    componentDidMount = async () => {
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
        return <li
            className={classnames(
                "background_media_player",
                {
                    ["lightBackground"]: this.state.thumbnailAnalysis?.isLight,
                    ["expanded"]: this.state.expanded,
                }
            )}
            style={{
                backgroundColor: this.state.thumbnailAnalysis?.rgba,
                "--averageColorValues": this.state.thumbnailAnalysis?.rgba,
            }}
        >
            <div
                className="background_media_player__background"
                style={{
                    backgroundImage: `url(${this.state.currentPlaying?.thumbnail})`
                }}
            />

            <div
                className="background_media_player__row"
                onClick={this.toogleExpand}
            >
                <div
                    id="sidebar_item_icon"
                    className={classnames(
                        "background_media_player__icon",
                        {
                            ["bounce"]: this.state.plabackState === "playing",
                        }
                    )}
                >
                    {
                        this.state.plabackState === "playing" ? <Icons.MdMusicNote /> : <Icons.MdPause />
                    }
                </div>

                <div
                    id="sidebar_item_content"
                    className="background_media_player__title"
                >
                    {
                        !this.state.expanded && <Marquee
                            gradientColor={RGBStringToValues(this.state.thumbnailAnalysis?.rgb)}
                            gradientWidth={20}
                            play={this.state.plabackState !== "stopped"}
                        >
                            <h4>
                                {
                                    this.state.plabackState === "stopped" ? "Nothing is playing" : <>
                                        {`${this.state.currentPlaying?.title} - ${this.state.currentPlaying?.artist}` ?? "Untitled"}
                                    </>
                                }
                            </h4>
                        </Marquee>
                    }
                    {
                        this.state.expanded && <h4>
                            <Icons.MdAlbum />

                            {
                                this.state.plabackState === "stopped" ? "Nothing is playing" : <>
                                    {this.state.currentPlaying?.title ?? "Untitled"}
                                </>
                            }
                        </h4>
                    }
                    {/* {
                        this.state.expanded && <p>
                            {this.state.currentPlaying?.artist ?? "Unknown artist"}
                        </p>
                    } */}
                </div>
            </div>
            <div
                className={classnames(
                    "background_media_player__row",
                    "background_media_player__controls",
                    {
                        ["hidden"]: !this.state.expanded,
                    }
                )}
            >
                <antd.Button
                    size="small"
                    shape="rounded"
                    type="ghost"
                    icon={<Icons.ChevronLeft />}
                    onClick={app.cores.player.playback.previous}
                />

                <antd.Button
                    size="small"
                    type="ghost"
                    shape="circle"
                    icon={this.state.plabackState === "playing" ? <Icons.MdPause /> : <Icons.MdPlayArrow />}
                    onClick={app.cores.player.playback.toogle}
                />

                <antd.Button
                    size="small"
                    shape="rounded"
                    type="ghost"
                    icon={<Icons.ChevronRight />}
                    onClick={app.cores.player.playback.next}
                />

                <antd.Button
                    size="small"
                    shape="rounded"
                    type="ghost"
                    icon={<Icons.Minimize />}
                    onClick={this.onClickMinimize}
                />
            </div>
        </li>
    }
}