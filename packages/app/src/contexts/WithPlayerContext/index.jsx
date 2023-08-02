import React from "react"

export const DefaultContextValues = {
    loading: false,
    minimized: false,

    muted: false,
    volume: 1,

    sync_mode: false,
    livestream_mode: false,
    control_locked: false,

    track_cover_analysis: null,
    track_metadata: null,

    playback_mode: "repeat",
    playback_status: null,
}

export const Context = React.createContext(DefaultContextValues)

export class WithPlayerContext extends React.Component {
    state = {
        loading: app.cores.player.state["loading"],
        minimized: app.cores.player.state["minimized"],

        muted: app.cores.player.state["muted"],
        volume: app.cores.player.state["volume"],

        sync_mode: app.cores.player.state["sync_mode"],
        livestream_mode: app.cores.player.state["livestream_mode"],
        control_locked: app.cores.player.state["control_locked"],

        track_manifest: app.cores.player.state["track_manifest"],

        playback_mode: app.cores.player.state["playback_mode"],
        playback_status: app.cores.player.state["playback_status"],
    }

    events = {
        "player.state.update": (state) => {
            this.setState(state)
        },
    }

    eventBus = app.cores.player.eventBus

    componentDidMount() {
        for (const [event, handler] of Object.entries(this.events)) {
            this.eventBus.on(event, handler)
        }
    }

    componentWillUnmount() {
        for (const [event, handler] of Object.entries(this.events)) {
            this.eventBus.off(event, handler)
        }
    }

    render() {
        return <Context.Provider value={this.state}>
            {this.props.children}
        </Context.Provider>
    }
}

export default WithPlayerContext