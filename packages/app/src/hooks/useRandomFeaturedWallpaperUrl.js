import React from "react"

export default () => {
    const [wallpaperData, setWallpaperData] = React.useState(null)

    const setRandomWallpaper = async () => {
        const { data } = await app.cores.api.customRequest({
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