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
		window.app.navigation.goToSettings()
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
		app.eventBus.emit("app.logout_request")
	}
}