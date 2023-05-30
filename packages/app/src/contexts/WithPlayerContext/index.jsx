import React from "react"

export const DefaultContextValues = {
    currentManifest: null,
    playbackStatus: null,
    coverColorAnalysis: null,
    loading: false,
    audioMuted: false,
    audioVolume: 1,
    minimized: false,
    streamMode: false,
    bpm: 0,
    syncMode: false,
    syncModeLocked: false,
}

export const Context = React.createContext(DefaultContextValues)

export class WithPlayerContext extends React.Component {
    state = {
        currentManifest: app.cores.player.getState("currentAudioManifest"),
        playbackStatus: app.cores.player.getState("playbackStatus") ?? "stopped",
        coverColorAnalysis: app.cores.player.getState("coverColorAnalysis"),
        loading: app.cores.player.getState("loading") ?? false,
        audioMuted: app.cores.player.getState("audioMuted") ?? false,
        audioVolume: app.cores.player.getState("audioVolume") ?? 0.3,
        minimized: app.cores.player.getState("minimized") ?? false,
        streamMode: app.cores.player.getState("livestream") ?? false,
        bpm: app.cores.player.getState("trackBPM") ?? 0,
        syncMode: app.cores.player.getState("syncModeLocked"),
        syncModeLocked: app.cores.player.getState("syncMode"),
    }

    events = {
        "player.syncModeLocked.update": (to) => {
            this.setState({ syncModeLocked: to })
        },
        "player.syncMode.update": (to) => {
            this.setState({ syncMode: to })
        },
        "player.livestream.update": (data) => {
            this.setState({ streamMode: data })
        },
        "player.bpm.update": (data) => {
            this.setState({ bpm: data })
        },
        "player.loading.update": (data) => {
            this.setState({ loading: data })
        },
        "player.status.update": (data) => {
            this.setState({ playbackStatus: data })
        },
        "player.current.update": (data) => {
            this.setState({ currentManifest: data })
        },
        "player.mute.update": (data) => {
            this.setState({ audioMuted: data })
        },
        "player.volume.update": (data) => {
            this.setState({ audioVolume: data })
        },
        "player.minimized.update": (minimized) => {
            this.setState({ minimized })
        },
        "player.coverColorAnalysis.update": (data) => {
            this.setState({ coverColorAnalysis: data })
        }
    }

    componentDidMount() {
        for (const [event, handler] of Object.entries(this.events)) {
            app.eventBus.on(event, handler)
        }
    }

    componentWillUnmount() {
        for (const [event, handler] of Object.entries(this.events)) {
            app.eventBus.off(event, handler)
        }
    }

    render() {
        return <Context.Provider value={this.state}>
            {this.props.children}
        </Context.Provider>
    }
}

export default WithPlayerContext