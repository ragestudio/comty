import MediaRTCChannelCard from "@components/MediaRTCChannelCard"
import FloatingScreens from "@components/FloatingScreens"

export default class UI {
	constructor(core) {
		this.core = core
	}

	domWindow = null
	floatingScreen = null

	attach() {
		if (this.domWindow || !app.layout.tools_bar) {
			return false
		}

		this.domWindow = app.layout.tools_bar.attachRender(
			"mediartc-channel",
			MediaRTCChannelCard,
			undefined,
			{
				position: "bottom",
			},
		)
	}

	detach() {
		if (!this.domWindow || !app.layout.tools_bar) {
			return false
		}

		app.layout.tools_bar.detachRender("mediartc-channel")

		this.domWindow = null
	}

	attachFloatingScreens() {
		if (this.floatingScreen || !app.layout.tools_bar) {
			return false
		}

		if (this.core.screens.size === 0) {
			return false
		}

		this.floatingScreen = app.layout.tools_bar.attachRender(
			"mediartc-floating-screens",
			FloatingScreens,
			undefined,
			{
				position: "top",
			},
		)
	}

	detachFloatingScreens() {
		if (!this.floatingScreen || !app.layout.tools_bar) {
			return false
		}

		app.layout.tools_bar.detachRender("mediartc-floating-screens")

		this.floatingScreen = null
	}
}
