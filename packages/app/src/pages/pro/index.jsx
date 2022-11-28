import React from "react"
import config from "config"

import "./index.less"

export default () => {
    return <div className="proManager">
        <div className="banner">
            <h1>{config.app.siteName} PRO</h1>
    
        </div>
    </div>
}