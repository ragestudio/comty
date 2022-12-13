import React from "react"
import loadable from "@loadable/component"
import * as antd from "antd"

const DebuggersComponentsPaths = {
    ...import.meta.glob("/src/debug/components/**/[a-z[]*.jsx"),
    ...import.meta.glob("/src/debug/components/**/[a-z[]*.tsx")
}

class DebuggerRender extends React.PureComponent {
    state = {
        error: null,
    }

    componentDidCatch(error, info) {
        console.error(error, info)
        this.setState({ error })
    }

    render() {
        const { renderFile } = this.props

        if (this.state.error) {
            return <div>
                <h1>Something went wrong</h1>
                <pre>
                    {this.state.error.toString()}
                </pre>
            </div>
        }

        return React.createElement(loadable(renderFile, { fallback: <div>Loading...</div> }))
    }
}

export default (props) => {
    const [activeDebuggerFile, setActiveDebugger] = React.useState(null)

    const handleDebbugerSelect = (key) => {
        setActiveDebugger(key)
    }

    if (activeDebuggerFile) {
        const DebuggerFile = DebuggersComponentsPaths[activeDebuggerFile]

        return <div className="debugger">
            <div className="debugger_header">
                <antd.Button onClick={() => setActiveDebugger(null)}>
                    Back
                </antd.Button>
            </div>
            <div className="debugger_content">
                <DebuggerRender renderFile={DebuggerFile} />
            </div>
        </div>
    }

    return <div className="debugger">
        <h1>Select a debugger</h1>

        <div className="debuggerMenu">
            {
                Object.keys(DebuggersComponentsPaths).map((key, index) => {
                    return <div key={index} className="debuggerMenuItem">
                        <button onClick={() => handleDebbugerSelect(key)}>
                            {key}
                        </button>
                    </div>
                })
            }
        </div>
    </div>
}