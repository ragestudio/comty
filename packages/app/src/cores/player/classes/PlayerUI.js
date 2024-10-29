import ToolBarPlayer from "@components/Player/ToolBarPlayer"

export default class PlayerUI {
    constructor(player) {
        this.player = player

        return this
    }

    currentDomWindow = null

    //
    // UI Methods
    //
    attachPlayerComponent() {
        if (this.currentDomWindow) {
            this.player.console.warn("EmbbededMediaPlayer already attached")
            return false
        }

        if (app.layout.tools_bar) {
            this.currentDomWindow = app.layout.tools_bar.attachRender("mediaPlayer", ToolBarPlayer, undefined, {
                position: "bottom",
            })
        }
    }

    detachPlayerComponent() {
        if (!this.currentDomWindow) {
            this.player.console.warn("EmbbededMediaPlayer not attached")
            return false
        }

        if (!app.layout.tools_bar) {
            this.player.console.error("Tools bar not found")
            return false
        }

        app.layout.tools_bar.detachRender("mediaPlayer")

        this.currentDomWindow = null
    }
}