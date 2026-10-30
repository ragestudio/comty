import { openModal as openSettingsModal } from "@/pages/settings"

export default {
	apps: () => {
		app.controls.openAppsMenu()
	},
	addons: () => {
		window.app.location.push("/addons")
	},
	studio: () => {
		window.app.location.push("/studio")
	},
	settings: () => {
		openSettingsModal()
		//window.app.navigation.goToSettings()
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
	profile: () => {
		window.app.navigation.goToAccount()
	},
	login: () => {
		window.app.navigation.goAuth()
	},
	logout: () => {
		app.auth.logout()
	},
}
