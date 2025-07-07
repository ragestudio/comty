import React from "react"
import config from "@config"

import useRandomFeaturedWallpaperUrl from "@hooks/useRandomFeaturedWallpaperUrl"
import useUrlQueryActiveKey from "@hooks/useUrlQueryActiveKey"

import RegisterForm from "./forms/register"
import MainSelector from "./forms/selector"
import RecoveryForm from "./forms/recovery"

const keyToComponents = {
	selector: MainSelector,
	register: RegisterForm,
	recovery: RecoveryForm,
}

import "./index.mobile.less"

const AuthPage = (props) => {
	const randomWallpaperURL = useRandomFeaturedWallpaperUrl()
	const [activeKey, setActiveKey] = useUrlQueryActiveKey({
		defaultKey: "selector",
	})

	return (
		<div className="login-page">
			<div
				style={{
					backgroundImage: `url(${randomWallpaperURL})`,
				}}
				className="wallpaper"
			/>

			<div className="login-page-card">
				<div className="login-page-card__header">
					<img
						className="login-page-card__header__logo"
						src={config.logo.alt}
					/>
				</div>

				<div className="login-page-card__content">
					{React.createElement(
						keyToComponents[activeKey] ?? keyToComponents["selector"],
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
