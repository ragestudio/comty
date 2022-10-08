import React from "react"
import config from "config"

export default (props) => {
    if (!props.session) {
        window.app.setLocation(config.app?.authPath ?? "/login")
        return <div />
    }

    window.app.setLocation(config.app?.mainPath ?? "/home")

    return <div />
}