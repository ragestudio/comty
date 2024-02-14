import React from "react"
import Core from "evite/src/core"
import loadable from "@loadable/component"

const DebuggerFrame = (props) => {
    const [debugger_id, setDebuggerId] = React.useState(props.debugger_id)

    const debuggers = React.useMemo(() => {
        let paths = import.meta.glob("/src/pages/_debug/**/[a-z[]*.jsx")

        paths = Object.keys(paths).map((path) => {
            let route = path
                .replace(/\/src\/pages\/_debug\/|index|\.jsx$/g, "")
                .replace(/\/src\/pages\/_debug\/|index|\.tsx$/g, "")

            // remove the last /
            if (route.endsWith("/")) {
                route = route.slice(0, -1)
            }

            return {
                path: route,
                element: paths[path],
            }
        })

        paths = paths.reduce((acc, { path, element }) => {
            acc[path] = element
            return acc
        }, {})

        return paths
    }, [])

    React.useEffect(() => {
        props.updateTitle(`Debugger`)
    }, [])

    React.useEffect(() => {
        props.updateTitle(`Debugger - ${debugger_id}`)
    }, [debugger_id])

    const Debugger = loadable(debuggers[debugger_id], {
        fallback: <div>Loading...</div>
    })

    return <div className="debugger">
        {
            debugger_id in debuggers && React.createElement(
                Debugger,
                {
                    updateTitle: props.updateTitle,
                    updatePosition: props.updatePosition,
                    updateDimensions: props.updateDimensions,
                    close: props.close,
                }
            )
        }
        {
            !(debugger_id in debuggers) && <div>Select a debugger</div>
        }
    </div>
}

export default class DebugCore extends Core {
    static namespace = "debug"
    static dependencies = [
        "window_mng",
    ]

    public = {
        open: this.open.bind(this),
    }

    async open(debugger_id) {
        app.cores.window_mng.render(
            "debugger_frame",
            <DebuggerFrame
                debugger_id={debugger_id}
            />,
            {
                useFrame: true,
                createOrUpdate: true,
            }
        )
    }
}