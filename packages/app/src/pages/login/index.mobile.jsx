import React from "react"

import "./index.less"

export default (props) => {
    const [wallpaperData, setWallpaperData] = React.useState(null)

    const setRandomWallpaper = async () => {
        const featuredWallpapers = await app.cores.api.request("main", "get", "featuredWallpapers").catch((err) => {
            console.error(err)
            return []
        })

        // get random wallpaper from array
        const randomWallpaper = featuredWallpapers[Math.floor(Math.random() * featuredWallpapers.length)]

        setWallpaperData(randomWallpaper)
    }

    React.useEffect(() => {
        if (app.userData) {
            return app.goMain()
        }

        setRandomWallpaper()

        app.eventBus.emit("app.createLogin", {
            defaultLocked: true,
        })
    }, [])

    return <div className="loginPage">
        <div
            style={{
                backgroundImage: `url(${wallpaperData?.url})`,
            }}
            className="wallpaper"
        >
            <p>
                {wallpaperData?.author ? wallpaperData.author : null}
            </p>
        </div>
    </div>
}