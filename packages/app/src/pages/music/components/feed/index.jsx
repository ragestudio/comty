import React from "react"
import * as antd from "antd"
import { ImageViewer } from "components"
import { Icons } from "components/Icons"

import FeedModel from "models/feed"

import "./index.less"

const PlaylistItem = (props) => {
    const { playlist } = props

    const onClick = () => {
        if (typeof props.onClick === "function") {
            return props.onClick(playlist)
        }

        return app.setLocation(`/play/${playlist._id}`)
    }

    return <div
        id={playlist._id}
        key={props.key}
        className="playlistItem"
        onClick={onClick}
    >
        <div className="playlistItem_cover">
            <ImageViewer src={playlist.cover ?? "/assets/no_song.png"} />
        </div>
        <div className="playlistItem_info">
            <div className="playlistItem_info_title">
                {playlist.title}
            </div>
            <div className="playlistItem_info_author">
                {playlist.user.username}
            </div>
        </div>
    </div>
}

export default () => {
    const [loading, setLoading] = React.useState(true)
    const [list, setList] = React.useState([])

    const loadData = async () => {
        setLoading(true)

        const response = await FeedModel.getPlaylistsFeed({
            limit: 10,
            trim: 0,
        }).catch((err) => {
            console.error(err)
            app.message.error("Failed to load playlists")
            return null
        })

        setLoading(false)

        console.log(response)

        if (response) {
            setList(response)
        }
    }

    React.useEffect(() => {
        loadData()
    }, [])

    if (loading) {
        return <antd.Skeleton active />
    }

    return <div className="playlistExplorer">
        <div className="playlistExplorer_section">
            <div className="playlistExplorer_section_header">
                <h1><Icons.Compass /> Releases from your artist</h1>
            </div>
            <div className="playlistExplorer_section_list">
                {
                    list.map((playlist, index) => {
                        return <PlaylistItem
                            key={index}
                            playlist={playlist}
                        />
                    })
                }
            </div>
        </div>

        <div className="playlistExplorer_section">
            <div className="playlistExplorer_section_header">
                <h1><Icons.MdOutlineTrendingUp /> Discover new trends</h1>
            </div>
            <div className="playlistExplorer_section_list">
                {
                    list.map((playlist, index) => {
                        return <PlaylistItem
                            key={index}
                            playlist={playlist}
                        />
                    })
                }
            </div>
        </div>
    </div>
}