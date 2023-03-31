import React from "react"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const handleClose = () => {
        app.electron.closeApp()
    }

    const handleMinimize = () => {
        app.electron.minimizeApp()
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