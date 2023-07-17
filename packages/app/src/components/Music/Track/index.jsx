import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import LikeButton from "components/LikeButton"
import seekToTimeLabel from "utils/seekToTimeLabel"

import { ImageViewer } from "components"
import { Icons } from "components/Icons"

import { Context } from "contexts/WithPlayerContext"

import "./index.less"

export default (props) => {
    // use react context to get the current track
    const {
        currentManifest,
        playbackStatus,
    } = React.useContext(Context)

    const isLiked = props.track?.liked
    const isCurrent = currentManifest?._id === props.track._id
    const isPlaying = isCurrent && playbackStatus === "playing"

    const handleClickPlayBtn = React.useCallback(() => {
        if (typeof props.onClickPlayBtn === "function") {
            props.onClickPlayBtn(props.track)
        } else {
            console.warn("Searcher: onClick is not a function, using default action...")
            app.cores.player.start(props.track)
        }
    })

    return <div
        id={props.track._id}
        className={classnames(
            "music-track",
            {
                ["current"]: isCurrent,
                ["playing"]: isPlaying,
            }
        )}
    >
        <div className={classnames(
            "music-track_actions",
            {
                ["withOrder"]: props.order !== undefined,
            }
        )}>
            <div className="music-track_action">
                <span className="music-track_orderIndex">
                    {
                        props.order
                    }
                </span>
                <antd.Button
                    type="primary"
                    shape="circle"
                    icon={isPlaying ? <Icons.MdPause /> : <Icons.MdPlayArrow />}
                    onClick={handleClickPlayBtn}
                />
            </div>
        </div>

        <div className="music-track_cover">
            <ImageViewer src={props.track.cover ?? props.track.thumbnail} />
        </div>

        <div className="music-track_details">
            <div className="music-track_title">
                {props.track.title}
            </div>
            <div className="music-track_artist">
                {props.track.artist}
            </div>
        </div>

        <div className="music-track_right_actions">
            <div className="music-track_info">
                <div className="music-track_info_duration">
                    {
                        props.track.metadata?.duration
                            ? seekToTimeLabel(props.track.metadata?.duration)
                            : "00:00"
                    }
                </div>
            </div>

            <LikeButton
                liked={isLiked}
                onClick={props.onLike}
            />
        </div>
    </div>
}