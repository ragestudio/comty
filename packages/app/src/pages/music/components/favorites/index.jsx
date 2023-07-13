import React from "react"
import * as antd from "antd"

import PlaylistView from "components/Music/PlaylistView"

import MusicModel from "comty.js/models/music"

export default () => {
    const [L_Favorites, R_Favorites, E_Favorites] = app.cores.api.useRequest(MusicModel.getFavorites)

    if (E_Favorites) {
        return <antd.Result
            status="error"
            title="Error"
            subTitle={E_Favorites.message}
        />
    }

    if (L_Favorites) {
        return <antd.Skeleton active />
    }

    return <PlaylistView
        type="vertical"
        playlist={{
            title: "Your favorites",
            cover: "https://storage.ragestudio.net/comty-static-assets/favorite_song.png",
            list: R_Favorites
        }}
        centered={app.isMobile}
    />
}