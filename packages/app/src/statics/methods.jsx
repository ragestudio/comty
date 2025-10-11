//import { Lightbox } from "react-modal-image"

import Lightbox from "@components/Lightbox"
import NotificationsCenter from "@components/NotificationsCenter"
import PostCreator from "@components/PostCreator"
import Searcher from "@components/Searcher"
import AppsMenu from "@components/AppsMenu"

import config from "@config"
import deleteInternalStorage from "@utils/deleteInternalStorage"

export default {
	controls: {
		toggleUIVisibility: (to) => {
			if (app.layout.sidebar) {
				app.layout.sidebar.toggleVisibility(to)
			}

			if (app.layout.tools_bar) {
				app.layout.tools_bar.toggleVisibility(to)
			}

			if (app.layout.top_bar) {
				app.layout.top_bar.toggleVisibility(to)
			}

			if (app.layout.floatingStack) {
				app.layout.floatingStack.toggleGlobalVisibility(to)
			}
		},
		openAppsMenu: () => {
			app.layout.drawer.open("apps", AppsMenu)
		},
		// Opens the notification window and sets up the UI for the notification to be displayed
		openNotifications: () => {
			window.app.layout.drawer.open(
				"notifications",
				NotificationsCenter,
				{
					props: {
						width: "fit-content",
					},
					allowMultiples: false,
					escClosable: true,
				},
			)
		},
		openSearcher: (options) => {
			if (app.isMobile) {
				return app.layout.draggable.open("searcher", Searcher, {
					...options,
					componentProps: {
						renderResults: true,
						autoFocus: true,
					},
				})
			}

			return app.layout.modal.open(
				"searcher",
				(props) => (
					<Searcher
						autoFocus
						renderResults
						{...props}
					/>
				),
				{
					framed: false,
				},
			)
		},
		openMessages: () => {
			app.location.push("/messages")
		},
		openFullImageViewer: (media, options = {}) => {
			if (!Array.isArray(media)) {
				media = [media]
			}

			app.cores.window_mng.render(
				"image_lightbox",
				<Lightbox
					index={options?.index}
					media={media}
					onClose={() => app.cores.window_mng.close("image_lightbox")}
				/>,
			)
		},
		openPostCreator: (params) => {
			app.layout.modal.open(
				"post_creator",
				(props) => (
					<PostCreator
						{...props}
						{...params}
					/>
				),
				{
					framed: false,
				},
			)
		},
	},
	navigation: {
		reload: () => {
			window.location.reload()
		},
		softReload: () => {
			app.eventBus.emit("app.softReload")
		},
		goAuth: () => {
			return app.location.push(config.app.authPath ?? "/auth")
		},
		goMain: () => {
			return app.location.push(config.app.mainPath ?? "/home")
		},
		goToMusic: () => {
			return app.location.push("/music")
		},
		goToSettings: (setting_id) => {
			return app.location.push(`/settings`, {
				query: {
					setting: setting_id,
				},
			})
		},
		goToAccount: (username) => {
			if (!username) {
				if (!app.userData) {
					console.error(
						"Cannot go to account, no username provided and no user logged in",
					)
					return false
				}

				username = app.userData.username
			}

			return app.location.push(`/account/${username}`)
		},
		goToPost: (post_id) => {
			return app.location.push(`/post/${post_id}`)
		},
		goToPlaylist: (playlist_id) => {
			return app.location.push(`/play/${playlist_id}`)
		},
	},
	capacitor: {
		isAppCapacitor: () => window.navigator.userAgent === "capacitor",
		setStatusBarStyleDark: async () => {
			if (!window.app.capacitor.isAppCapacitor()) {
				console.warn(
					"[App] setStatusBarStyleDark is only available on capacitor",
				)
				return false
			}
			return await StatusBar.setStyle({ style: Style.Dark })
		},
		setStatusBarStyleLight: async () => {
			if (!window.app.capacitor.isAppCapacitor()) {
				console.warn(
					"[App] setStatusBarStyleLight is not supported on this platform",
				)
				return false
			}
			return await StatusBar.setStyle({ style: Style.Light })
		},
		hideStatusBar: async () => {
			if (!window.app.capacitor.isAppCapacitor()) {
				console.warn(
					"[App] hideStatusBar is not supported on this platform",
				)
				return false
			}

			return await StatusBar.hide()
		},
		showStatusBar: async () => {
			if (!window.app.capacitor.isAppCapacitor()) {
				console.warn(
					"[App] showStatusBar is not supported on this platform",
				)
				return false
			}
			return await StatusBar.show()
		},
	},
	maintenance: {
		clearInternalStorage: async () => {
			app.layout.modal.confirm({
				headerText: "Clear internal storage",
				descriptionText:
					"Are you sure you want to clear all internal storage? This will remove all your data from the app, including your session.",
				onConfirm: () => {
					deleteInternalStorage()
				},
			})
		},
	},
}
