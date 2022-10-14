import React from "react"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const handleClose = () => {
        app.eventBus.emit("app.close")
    }

    const handleMinimize = () => {
        app.eventBus.emit("app.minimize")
    }

    return <div className="app_systemBar">
        <div className="icons">
            <div className="icon" onClick={handleMinimize}>
                <Icons.MinusCircle />
            </div>
            <div className="icon" onClick={handleClose}>
                <Icons.XCircle />
            </div>
        </div>
    </div>
}