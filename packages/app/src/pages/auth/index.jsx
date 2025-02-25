import React from "react"

import useRandomFeaturedWallpaperUrl from "@hooks/useRandomFeaturedWallpaperUrl"
import useUrlQueryActiveKey from "@hooks/useUrlQueryActiveKey"

import RegisterForm from "./forms/register"
import MainSelector from "./forms/selector"
import RecoveryForm from "./forms/recovery"

import "./index.less"

const GradientSVG = () => {
	return (
		<svg height="100%" width="100%">
			<defs>
				<linearGradient id="0" x1="0" y1="0.5" x2="1" y2="0.5">
					<stop offset="0%" stop-color="rgba(225, 0, 209, 0.1)" />
					<stop offset="25%" stop-color="rgba(233, 0, 182, 0.08)" />
					<stop offset="50%" stop-color="rgba(240, 0, 154, 0.05)" />
					<stop offset="100%" stop-color="rgba(255, 0, 0, 0)" />
				</linearGradient>
				<radialGradient
					id="1"
					gradientTransform="translate(-0.81 -0.5) scale(2, 1.2)"
				>
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
	)
}

const keyToComponents = {
	selector: MainSelector,
	register: RegisterForm,
	recovery: RecoveryForm,
}

const AuthPage = (props) => {
	const [activeKey, setActiveKey] = useUrlQueryActiveKey({
		defaultKey: "selector",
	})
	const randomWallpaperURL = useRandomFeaturedWallpaperUrl()

	return (
		<div className="login-page">
			<div className="background">
				<GradientSVG />
			</div>

			<div className="wrapper">
				<div
					className="wrapper_background"
					style={{
						backgroundImage: randomWallpaperURL
							? `url(${randomWallpaperURL})`
							: null,
						animation: randomWallpaperURL ? "opacityIn 1s" : null,
					}}
				/>

				<div className="content">
					{React.createElement(
						keyToComponents[activeKey] ??
							keyToComponents["selector"],
						{
							setActiveKey: setActiveKey,
						},
					)}
				</div>
			</div>
		</div>
	)
}

export default AuthPage
