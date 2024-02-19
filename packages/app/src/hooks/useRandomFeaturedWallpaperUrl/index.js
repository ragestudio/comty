import React from "react"

export default () => {
    const [wallpaperData, setWallpaperData] = React.useState(null)

    const setRandomWallpaper = async () => {
        const { data: featuredWallpapers } = await app.cores.api.customRequest({
            method: "GET",
            url: "/featured_wallpapers"
        }).catch((err) => {
            console.error(err)
            return []
        })

        // get random wallpaper from array
        const randomWallpaper = featuredWallpapers[Math.floor(Math.random() * featuredWallpapers.length)]

        setWallpaperData(randomWallpaper)
    }

    React.useEffect(() => {
        setRandomWallpaper()
    }, [])

    return wallpaperData
}