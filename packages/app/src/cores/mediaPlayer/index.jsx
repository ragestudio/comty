import React from "react"
import ReactDOM from "react-dom"
import Core from "evite/src/core"

import { EmbbededMediaPlayer } from "components"

import { DOMWindow } from "components/RenderWindow"

import "./index.less"

const EmbbededMediaPlayerWrapper = (props) => {
    return <div className="embbededMediaPlayerWrapper">
        {props.children}
    </div>
}

export default class MediaPlayerCore extends Core {
    constructor(props) {
        super(props)

    }
    currentDomWindow = null

    publicMethods = {
        MediaPlayerCore: this,
    }

    attachEmbbededMediaPlayer() {
        if (this.currentDomWindow) {
            console.warn("EmbbededMediaPlayer already attached")
            return false
        }

        this.currentDomWindow = new DOMWindow({
            id: "mediaPlayer"
        })

        this.currentDomWindow.render(<EmbbededMediaPlayerWrapper><EmbbededMediaPlayer /></EmbbededMediaPlayerWrapper>)
    }
}