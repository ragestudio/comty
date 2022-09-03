import React from "react"
import config from "config"

export default (props) => {
    window.app.setLocation(config.app?.mainPath ?? "/home")
    return <div />
}