import React from "react"
import * as antd from "antd"

import "./index.less"

const swfResource = "http://storage.ragestudio.net/gose-uploads/d4rcb9h-3a24f55c-12b4-4c03-a351-a06ed17111c9.swf"

function loadRuffle() {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script")

        script.src = "https://unpkg.com/@ruffle-rs/ruffle"
        script.async = true
        script.onload = () => {
            return resolve(script)
        }

        document.body.appendChild(script)
    })
}

class Game extends React.Component {
    ruffleScript = null

    playerRef = React.createRef()

    componentDidMount = async () => {
        app.layout.toggleCenteredContent(false)

        this.ruffleScript = await loadRuffle()

        const ruffle = window.RufflePlayer.newest()
        const player = ruffle.createPlayer()

        this.playerRef.current.appendChild(player)

        player.load(swfResource)
    }

    componentWillUnmount() {
        document.body.removeChild(this.ruffleScript)
    }

    downloadResource = () => {
        const a = document.createElement("a")
        a.href = swfResource
        a.download = "pony.swf"
        a.click()
    }

    render() {
        return <div
            ref={this.playerRef}
            className="ruffle_game"
        >
            <antd.Button
                onClick={this.downloadResource}
            >
                Download SWF
            </antd.Button>
        </div>
    }
}

export default Game