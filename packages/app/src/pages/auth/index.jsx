import React from "react"
import Background from "./background"

import useRandomFeaturedWallpaperUrl from "@hooks/useRandomFeaturedWallpaperUrl"
import useUrlQueryActiveKey from "@hooks/useUrlQueryActiveKey"

import RegisterForm from "./forms/register"
import MainSelector from "./forms/selector"
import RecoveryForm from "./forms/recovery"

import "./index.less"

const keyToComponents = {
	selector: MainSelector,
	register: RegisterForm,
	recovery: RecoveryForm,
}

const AuthPage = () => {
	const [activeKey, setActiveKey] = useUrlQueryActiveKey({
		defaultKey: "selector",
	})
	const randomWallpaperURL = useRandomFeaturedWallpaperUrl()

	return (
		<div className="login-page">
			<div className="background">
				<Background
					color={[1, 0.5, 0.3]}
					speed={0.1}
				/>
			</div>

			<div className="login-page-card">
				<div
					className="login-page-card__background"
					style={{
						backgroundImage: randomWallpaperURL
							? `url(${randomWallpaperURL})`
							: null,
						animation: randomWallpaperURL ? "opacityIn 1s" : null,
					}}
				/>

				<div className="login-page-card__content">
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
