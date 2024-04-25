import React from "react"

import useRandomFeaturedWallpaperUrl from "@hooks/useRandomFeaturedWallpaperUrl"

import RegisterForm from "./forms/register"
import MainSelector from "./forms/selector"

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

const stagesToComponents = {
    0: MainSelector,
    2: RegisterForm
}

const AuthPage = (props) => {
    const [stage, setStage] = React.useState(0)
    const randomWallpaperURL = useRandomFeaturedWallpaperUrl()

    function changeStage(nextStage) {
        setStage(nextStage)
    }

    const onClickLogin = () => {
        app.controls.openLoginForm()
    }

    const onClickRegister = () => {
        changeStage(2)
    }

    return <div className="loginPage">
        <div className="background">
            <GradientSVG />
        </div>

        <div className="wrapper">
            <div
                className="wrapper_background"
                style={{
                    backgroundImage: randomWallpaperURL ? `url(${randomWallpaperURL})` : null,
                    animation: randomWallpaperURL ? "opacityIn 1s" : null
                }}
            />

            <div className="content">
                {
                    React.createElement(stagesToComponents[stage] ?? stagesToComponents[0], {
                        onClickLogin,
                        onClickRegister,
                        changeStage,
                    })
                }
            </div>
        </div>
    </div>
}

export default AuthPage