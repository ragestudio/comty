import React from "react"
import * as antd from "antd"

import PlaylistView from "@components/Music/PlaylistView"

import MusicService from "@models/music"

import "./index.less"

const Item = (props) => {
    const { type, id } = props.params

    const [loading, result, error, makeRequest] = app.cores.api.useRequest(MusicService.getReleaseData, id)

    if (error) {
        return <antd.Result
            status="warning"
            title="Error"
            subTitle={error.message}
        />
    }

    if (loading) {
        return <antd.Skeleton active />
    }

    return <div className="track-page">
        <PlaylistView
            playlist={result}
            centered={app.isMobile}
            hasMore={false}
        />
    </div>
}

export default Item