import React from "react"
import * as antd from "antd"

import { Icons, createIconRender } from "components/Icons"

export default (props) => {
    const [mode, setMode] = React.useState(app.cores.player.playback.mode())

    const modeToIcon = {
        "normal": "MdArrowForward",
        "repeat": "MdRepeat",
        "shuffle": "MdShuffle",
    }

    const onClick = () => {
        const modes = Object.keys(modeToIcon)

        const newMode = modes[(modes.indexOf(mode) + 1) % modes.length]

        app.cores.player.playback.mode(newMode)

        setMode(newMode)
    }

    return <antd.Button
        icon={createIconRender(modeToIcon[mode])}
        onClick={onClick}
        disabled={props.disabled ?? false}
        type="ghost"
    />
}
