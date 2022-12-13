import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { ImageViewer } from "components"

import PlaylistsModel from "models/playlists"

import "./index.less"

const PlaylistItem = ({ playlist }) => {
    return <div>
        Playlist Tracks
    </div>
}

const TrackItem = ({ track }) => {
    return <div>
        Track
    </div>
}

export default (props) => {
    const play_id = props.match.params.play_id

    const [playlist, setPlaylist] = React.useState(null)

    const loadData = async () => {
        const response = await PlaylistsModel.getPlaylist(play_id).catch((err) => {
            console.error(err)
            app.message.error("Failed to load playlist")
            return null
        })

        console.log(response)

        if (response) {
            setPlaylist(response)
        }
    }

    React.useEffect(() => {
        loadData()
    }, [])

    if (!playlist) {
        return <antd.Skeleton active />
    }

    const renderComponent = () => {
        switch (playlist.type) {
            case "playlist": {
                return <PlaylistItem playlist={playlist} />
            }
            case "track": {
                return <TrackItem track={playlist} />
            }
            default: {
                return <TrackItem track={playlist} />
            }
        }
    }

    return <div
        className={
            classnames("play", playlist.type)
        }
    >
        <div className="play_info_wrapper">
            <div className="play_info">
                <div className="play_info_cover">
                    <ImageViewer src={playlist?.cover ?? "/assets/no_song.png"} />
                </div>

                <div className="play_info_details">
                    <div className="play_info_title">
                        <h1>{playlist.title}</h1>
                    </div>
                    <div className="play_info_author">
                        {playlist.user.username}
                    </div>
                </div>
            </div>
        </div>

        {renderComponent()}
    </div>
}