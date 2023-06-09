import React from "react"
import * as antd from "antd"
import config from "config"

import { Icons } from "components/Icons"
import { Footer } from "components"

import "./index.less"

const GradientSVG = () => {
    return <svg height="100%" width="100%">
        <defs>
            <linearGradient id="0" x1="0" y1="0.5" x2="1" y2="0.5">
                <stop offset="0%" stop-color="rgba(225, 0, 209, 0.1)" />
                <stop offset="25%" stop-color="rgba(233, 0, 182, 0.08)" />
                <stop offset="50%" stop-color="rgba(240, 0, 154, 0.05)" />
                <stop offset="100%" stop-color="rgba(255, 0, 0, 0)" />
            </linearGradient>
            <radialGradient id="1" gradientTransform="translate(-0.81 -0.5) scale(2, 1.2)">
                <stop offset="0%" stop-color="rgba(255, 96, 100, 0.2)" />
                <stop offset="20%" stop-color="rgba(255, 96, 100, 0.16)" />
                <stop offset="40%" stop-color="rgba(255, 96, 100, 0.12)" />
                <stop offset="60%" stop-color="rgba(255, 96, 100, 0.08)" />
                <stop offset="100%" stop-color="rgba(255, 96, 100, 0)" />
            </radialGradient>
        </defs>
        <rect fill="url(#0)" height="100%" width="100%" />
        <rect fill="url(#1)" height="100%" width="100%" />
    </svg>
}

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

    const onClickRegister = () => {
        app.controls.openRegisterForm()
    }

    const onClickLogin = () => {
        app.controls.openLoginForm()
    }

    React.useEffect(() => {
        setRandomWallpaper()
    }, [])

    return <div className="loginPage">
        <div className="background">
            <GradientSVG />
        </div>

        <div className="wrapper">
            <div
                className="wrapper_background"
                style={{
                    backgroundImage: wallpaperData ? `url(${wallpaperData.url})` : null,
                    animation: wallpaperData ? "opacityIn 1s" : null
                }}
            />

            <div className="content">
                <div className="content_header">
                    <img src={app.isMobile ? config.logo.alt : config.logo.full} className="logo" />
                </div>

                {
                    props.user && <div
                        className="actions"
                        style={{
                            marginBottom: "50px"
                        }}
                    >
                        <antd.Button
                            type="default"
                            size="large"
                            onClick={() => {
                                app.navigation.goMain()
                            }}
                        >
                            Continue as {props.user.username}
                        </antd.Button>
                    </div>
                }

                <div className="actions">
                    <antd.Button
                        onClick={onClickLogin}
                        size="large"
                        icon={<Icons.LogIn />}
                        type="primary"
                    >
                        Continue with a Comty™ Account
                    </antd.Button>

                    <antd.Button
                        onClick={onClickLogin}
                        size="large"
                        icon={<Icons.LogIn />}
                        type="primary"
                        disabled
                    >
                        Continue with a RageStudio© ID™
                    </antd.Button>
                </div>

                <h4>Or create a new account</h4>

                <div className="actions">
                    <antd.Button
                        onClick={onClickRegister}
                        icon={<Icons.UserPlus />}
                        type="primary"
                    >
                        Create a Comty™ Account
                    </antd.Button>

                    <p>
                        <Icons.Info />
                        Registering a new account accepts the <a>Terms and Conditions</a> and <a>Privacy policy</a> for the services provided by {config.author}
                    </p>
                </div>
            </div>
        </div>

        <Footer />
    </div>
}