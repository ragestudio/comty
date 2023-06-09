import React from "react"

import "./index.mobile.less"

export default (props) => {
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
        if (app.userData) {
            return app.navigation.goMain()
        }

        setRandomWallpaper()

        app.controls.openLoginForm({
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
            {/* <p>
                {wallpaperData?.author ? wallpaperData.author : null}
            </p> */}
        </div>
    </div>
}