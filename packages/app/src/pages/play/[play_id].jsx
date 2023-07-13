import React from "react"
import * as antd from "antd"

import PlaylistsModel from "models/playlists"

import PlaylistView from "components/Music/PlaylistView"

import "./index.less"

export default (props) => {
    const play_id = props.params.play_id

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

    return <PlaylistView
        playlist={playlist}
        centered={app.isMobile}
    />
}