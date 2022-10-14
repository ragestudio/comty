import React from "react"
import * as antd from "antd"
import config from "config"

import { Icons } from "components/Icons"
import { Footer } from "components"

import "./index.less"

export default (props) => {
    const [wallpaperData, setWallpaperData] = React.useState(null)

    const setRandomWallpaper = async () => {
        const featuredWallpapers = await app.api.request("main", "get", "featuredWallpapers").catch((err) => {
            console.error(err)
            return []
        })

        // get random wallpaper from array
        const randomWallpaper = featuredWallpapers[Math.floor(Math.random() * featuredWallpapers.length)]

        setWallpaperData(randomWallpaper)
    }

    const onClickRegister = () => {
        app.eventBus.emit("app.createRegister")
    }

    const onClickLogin = () => {
        app.eventBus.emit("app.createLogin")
    }

    React.useEffect(() => {
        setRandomWallpaper()
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

        <div className="wrapper">
            <img src={config.logo.full} className="logo" />

            <div className="content">
                <div className="title">
                    <h1>A prototype of a social network</h1>
                </div>

                {props.session && <div className="session_available">
                    <h3><Icons.AlertCircle /> You already have a valid session.</h3>
                    <div className="session_card">
                        @{props.session.username}
                    </div>
                    <antd.Button
                        type="primary"
                        onClick={() => window.app.setLocation(config.app?.mainPath ?? "/home")} >
                        Go to home
                    </antd.Button>
                </div>}

                <div className="buttonsBox">
                    <div className="register">
                        <antd.Button
                            type="primary"
                            size="large"
                            onClick={onClickRegister}
                        >
                            Create a new account
                        </antd.Button>
                        <p>Registering a new account accepts the <a>Terms and Conditions</a> and <a>Privacy policy</a> for the services provided by {config.author}</p>
                    </div>

                    <h3>
                        You have already an account?
                    </h3>

                    <antd.Button
                        onClick={onClickLogin}
                    >
                        Login
                    </antd.Button>
                </div>
            </div>
            <Footer />
        </div>
    </div>
}