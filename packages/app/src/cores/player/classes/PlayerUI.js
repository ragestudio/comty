import { toolsBarStore } from "@/stores/toolsbar"
import Player from "@components/Player"

export default class PlayerUI {
	constructor(player) {
		this.player = player

		return this
	}

	toolbarRenderId = null

	//
	// UI Methods
	//
	attachPlayerComponent() {
		if (this.toolbarRenderId) return

		const render = toolsBarStore
			.getState()
			.attachRender("mediaPlayer", Player, undefined, {
				position: "bottom",
			})

		this.toolbarRenderId = render.id
	}

	detachPlayerComponent() {
		toolsBarStore.getState().detachRender("mediaPlayer")
		this.toolbarRenderId = null
	}
}
