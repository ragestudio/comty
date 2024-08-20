import React from "react"

import useRandomFeaturedWallpaperUrl from "@hooks/useRandomFeaturedWallpaperUrl"

import "./index.mobile.less"

export default (props) => {
    const randomWallpaperURL = useRandomFeaturedWallpaperUrl()

    React.useEffect(() => {
        if (app.userData) {
            app.navigation.goMain()
        } else {
            app.controls.openLoginForm({
                defaultLocked: true,
            })
        }
    }, [])

    return <div className="loginPage">
        <div
            style={{
                backgroundImage: `url(${randomWallpaperURL})`,
            }}
            className="wallpaper"
        >
            {/* <p>
                {wallpaperData?.author ? wallpaperData.author : null}
            </p> */}
        </div>
    </div>
}