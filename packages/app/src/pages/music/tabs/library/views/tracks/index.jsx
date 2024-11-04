import React from "react"
import * as antd from "antd"

import PlaylistView from "@components/Music/PlaylistView"

import MusicModel from "@models/music"

const loadLimit = 50

const TracksLibraryView = () => {
    const [offset, setOffset] = React.useState(0)
    const [list, setList] = React.useState([])
    const [hasMore, setHasMore] = React.useState(true)
    const [initialLoading, setInitialLoading] = React.useState(true)

    const [L_Favourites, R_Favourites, E_Favourites, M_Favourites] = app.cores.api.useRequest(MusicModel.getFavouriteFolder, {
        offset: offset,
        limit: loadLimit,
    })

    async function onLoadMore() {
        const newOffset = offset + loadLimit

        setOffset(newOffset)

        M_Favourites({
            offset: newOffset,
            limit: loadLimit,
        })
    }

    React.useEffect(() => {
        if (R_Favourites && R_Favourites.tracks) {
            if (initialLoading === true) {
                setInitialLoading(false)
            }

            if (R_Favourites.tracks.list.length === 0) {
                setHasMore(false)
            } else {
                setList((prev) => {
                    prev = [
                        ...prev,
                        ...R_Favourites.tracks.list,
                    ]

                    return prev
                })
            }
        }
    }, [R_Favourites])

    if (E_Favourites) {
        return <antd.Result
            status="warning"
            title="Failed to load"
            subTitle={E_Favourites}
        />
    }

    if (initialLoading) {
        return <antd.Skeleton active />
    }

    return <PlaylistView
        noHeader
        loading={L_Favourites}
        type="vertical"
        playlist={{
            list: list
        }}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        length={R_Favourites.tracks.total_length}
    />
}

export default TracksLibraryView