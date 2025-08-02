import MediaRTCChannelCard from "@components/MediaRTCChannelCard"

export default class UI {
	constructor(core) {
		this.core = core
	}

	currentDomWindow = null
	videoGridModal = null

	attach() {
		if (this.currentDomWindow || !app.layout.tools_bar) {
			return false
		}

		this.currentDomWindow = app.layout.tools_bar.attachRender(
			"mediartc-channel",
			MediaRTCChannelCard,
			undefined,
			{
				position: "bottom",
			},
		)
	}

	detach() {
		if (!this.currentDomWindow || !app.layout.tools_bar) {
			return false
		}

		app.layout.tools_bar.detachRender("mediartc-channel")

		this.currentDomWindow = null
	}
}
