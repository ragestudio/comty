import React from "react"
import client from "comty.js/core/client"

export default () => {
    const [wallpaperData, setWallpaperData] = React.useState(null)

    const setRandomWallpaper = async () => {
        const { data } = await client.instance({
            method: "GET",
            url: "/featured/wallpapers",
            params: {
                random: true
            }
        }).catch((err) => {
            console.error(err)
            return []
        })

        setWallpaperData(data.url)
    }

    React.useEffect(() => {
        setRandomWallpaper()
    }, [])

    return wallpaperData
}