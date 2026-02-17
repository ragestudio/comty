import React from "react"
import * as antd from "antd"

import { createIconRender } from "@components/Icons"

const AccountButton = React.forwardRef((props, ref) => {
	const user = app.userData

	const handleClick = () => {
		if (!user) {
			return app.navigation.goAuth()
		}

		return app.navigation.goToAccount()
	}

	const handleHold = () => {
		app.layout.draggable.actions({
			list: [
				{
					key: "settings",
					icon: "Settings",
					label: "Settings",
					onClick: () => {
						app.navigation.goToSettings()
					},
				},
				{
					key: "account",
					icon: "User",
					label: "Account",
					onClick: () => {
						app.navigation.goToAccount()
					},
				},
				{
					key: "logout",
					icon: "LogOut",
					label: "Logout",
					danger: true,
					onClick: () => {
						app.auth.logout()
					},
				},
			],
		})
	}

	return (
		<div
			key="account"
			id="account"
			className="item"
			ref={ref}
			onClick={handleClick}
			onContextMenu={handleHold}
			context-menu="ignore"
		>
			<div className="icon">
				{user ? (
					<antd.Avatar
						shape="square"
						src={app.userData.avatar}
					/>
				) : (
					createIconRender("Login")
				)}
			</div>
		</div>
	)
})

AccountButton.displayName = "AccountButton"

export default AccountButton
