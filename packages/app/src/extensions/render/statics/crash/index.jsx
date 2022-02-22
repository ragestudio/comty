import React from "react"
import "./index.less"

export default (props) => {
    return <div className="app_crash">
        <div className="header">
            <h1>Crash</h1>
        </div>
        <h2>{props.crash.message}</h2>
        <pre>{props.crash.error}</pre>
        <div className="actions">
            <button onClick={() => window.location.reload()}>Reload</button>
        </div>
    </div>
}