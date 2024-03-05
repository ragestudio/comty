import React from "react"

const Context = React.createContext({
    playlist_data: null,
    owning_playlist: null,
    add_track: () => { },
    remove_track: () => { },
})

export default Context

export {
    Context
}