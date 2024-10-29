import React from "react"

import Image from "@components/Image"

import MusicModel from "@models/music"

const FeaturedPlaylist = (props) => {
    const [featuredPlaylist, setFeaturedPlaylist] = React.useState(false)

    const onClick = () => {
        if (!featuredPlaylist) {
            return
        }

        app.navigation.goToPlaylist(featuredPlaylist.playlist_id)
    }

    React.useEffect(() => {
        MusicModel.getFeaturedPlaylists().then((data) => {
            if (data[0]) {
                console.log(`Loaded featured playlist >`, data[0])
                setFeaturedPlaylist(data[0])
            }
        })
    }, [])

    if (!featuredPlaylist) {
        return null
    }

    return <div className="featured_playlist" onClick={onClick}>
        <Image
            src={featuredPlaylist.cover_url}
        />

        <div className="featured_playlist_content">
            <h1>{featuredPlaylist.title}</h1>
            <p>{featuredPlaylist.description}</p>

            {
                featuredPlaylist.genre && <div className="featured_playlist_genre">
                    <span>{featuredPlaylist.genre}</span>
                </div>
            }
        </div>
    </div>
}

export default FeaturedPlaylist