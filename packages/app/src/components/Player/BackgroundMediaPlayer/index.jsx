import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import Marquee from "react-fast-marquee"

import { Icons } from "@components/Icons"

import { WithPlayerContext, Context } from "@contexts/WithPlayerContext"

import "./index.less"

function RGBStringToValues(rgbString) {
    if (!rgbString) {
        return [0, 0, 0]
    }

    const rgb = rgbString.replace("rgb(", "").replace(")", "").split(",").map((v) => parseInt(v))

    return [rgb[0], rgb[1], rgb[2]]
}

export default (props) => {
    return <WithPlayerContext>
        <BackgroundMediaPlayer
            {...props}
        />
    </WithPlayerContext>
}

export class BackgroundMediaPlayer extends React.Component {
    static contextType = Context

    state = {
        expanded: false,
    }

    events = {
        "sidebar.expanded": (to) => {
            if (!to) {
                this.toggleExpand(false)
            }
        }
    }

    onClickMinimize = () => {
        app.cores.player.minimize()
    }

    toggleExpand = (to) => {
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
                    ["lightBackground"]: this.context.track_manifest?.cover_analysis?.isLight ?? false,
                    ["expanded"]: this.state.expanded,
                }
            )}
            style={{
                backgroundColor: this.context.track_manifest?.cover_analysis?.rgba,
                "--averageColorValues": this.context.track_manifest?.cover_analysis?.rgba,
            }}
        >
            <div
                className="background_media_player__background"
                style={{
                    backgroundImage: `url(${this.context.track_manifest?.cover ?? this.context.track_manifest?.thumbnail})`
                }}
            />

            <div
                className="background_media_player__row"
                onClick={this.toggleExpand}
            >
                <div
                    id="sidebar_item_icon"
                    className={classnames(
                        "background_media_player__icon",
                        {
                            ["bounce"]: this.context.playback_status === "playing",
                        }
                    )}
                >
                    {
                        this.context.playback_status === "playing" ? <Icons.MdMusicNote /> : <Icons.MdPause />
                    }
                </div>

                <div
                    id="sidebar_item_content"
                    className="background_media_player__title"
                >
                    {
                        !this.state.expanded && <Marquee
                            gradientColor={RGBStringToValues(this.context.track_cover_analysis?.rgb)}
                            gradientWidth={20}
                            play={this.context.playback_status !== "stopped"}
                        >
                            <h4>
                                {
                                    this.context.playback_status === "stopped" ? "Nothing is playing" : <>
                                        {`${this.context.track_manifest?.title} - ${this.context.track_manifest?.artist}` ?? "Untitled"}
                                    </>
                                }
                            </h4>
                        </Marquee>
                    }
                    {
                        this.state.expanded && <h4>
                            <Icons.MdAlbum />

                            {
                                this.context.playback_status === "stopped" ? "Nothing is playing" : <>
                                    {this.context.track_manifest?.title ?? "Untitled"}
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
                    icon={this.context.playback_status === "playing" ? <Icons.MdPause /> : <Icons.MdPlayArrow />}
                    onClick={app.cores.player.playback.toggle}
                />

                <antd.Button
                    size="small"
                    shape="rounded"
                    type="ghost"
                    icon={<Icons.FiChevronRight />}
                    onClick={app.cores.player.playback.next}
                />

                <antd.Button
                    size="small"
                    shape="rounded"
                    type="ghost"
                    icon={<Icons.FiMinimize />}
                    onClick={this.onClickMinimize}
                />
            </div>
        </li>
    }
}