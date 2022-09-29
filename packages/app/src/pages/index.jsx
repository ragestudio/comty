import React from "react"
import config from "config"

export default (props) => {
    const isLogged = typeof props.user === "object"

    if (!isLogged) {
        window.app.setLocation(config.app?.authPath ?? "/login")
        return <div />
    }

    window.app.setLocation(config.app?.mainPath ?? "/home")
    return <div />
}