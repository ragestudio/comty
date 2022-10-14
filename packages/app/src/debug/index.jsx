import React from "react"
import * as antd from "antd"

const DebuggersComponents = import.meta.glob("/src/debug/components/**/[a-z[]*.jsx")

export default (props) => {
    const [activeDebugger, setActiveDebugger] = React.useState(null)

    const handleDebbugerSelect = (key) => {
        setActiveDebugger(key)
    }

    if (activeDebugger) {
        const Debugger = DebuggersComponents[activeDebugger]

        return <div className="debugger">
            <div className="debugger_header">
                <antd.Button onClick={() => setActiveDebugger(null)}>
                    Back
                </antd.Button>
            </div>

            <Debugger />
        </div>
    }

    return <div className="debugger">
        <h1>Select a debugger</h1>

        <div className="debuggerMenu">
            {Object.keys(DebuggersComponents).map((key, index) => {
                return <div key={index} className="debuggerMenuItem">
                    <button onClick={() => handleDebbugerSelect(key)}>
                        {key}
                    </button>
                </div>
            })}
        </div>
    </div>
}