import React from "react"
import * as antd from "antd"

import PlaylistView from "@components/Music/PlaylistView"

import MusicModel from "@models/music"

const PlayView = (props) => {
    const play_id = props.params.play_id
    const service = props.query.service

    const [playlist, setPlaylist] = React.useState(null)
    const [offset, setOffset] = React.useState(0)

    const loadData = async (_offset) => {
        if (_offset) {
            const response = await MusicModel.getPlaylistItems({
                playlist_id: play_id,
                service,

                limit: 20,
                offset: _offset,
            })

            if (response) {
                return setPlaylist((prev) => {
                    return {
                        ...prev,
                        list: [...prev.list, ...response.list],
                    }
                })
            }
        } else {
            const response = await MusicModel.getPlaylistData({
                playlist_id: play_id,
                service,

                limit: 20,
            }).catch((err) => {
                console.error(err)
                app.message.error("Failed to load playlist")
                return null
            })

            if (response) {
                setPlaylist(response)
            }
        }
    }

    const onLoadMore = async () => {
        setOffset((prev) => {
            const newValue = prev + 20

            loadData(newValue)

            return newValue
        })
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

        onLoadMore={onLoadMore}
        hasMore={playlist.total_length > playlist.list.length}
    />
}

export default PlayView