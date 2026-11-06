import React from "react"

import { openModal as openSettingsModal } from "@/pages/settings"
import Popover from "@/ui/Popover"

import { ActionMenu } from "./actionMenu"

export default {
	account: (e, control) => {
		control.setDropdownOpen(true)

		const closeHook = Popover.open(e.domEvent, {
			onClose: () => control.setDropdownOpen(false),
			content: (props) =>
				React.createElement(ActionMenu, { ...props, closeHook }),
		})
	},
	apps: () => {
		app.controls.openAppsMenu()
	},
	settings: () => {
		openSettingsModal()
	},
	notifications: () => {
		window.app.controls.openNotifications()
	},
	search: () => {
		window.app.controls.openSearcher()
	},
	create: () => {
		window.app.controls.openCreator()
	},
}
