import React from "react"

import WidgetsManager from "../components/widgetsManager"

export default {
    id: "widgets",
    icon: "FiList",
    label: "Widgets",
    group: "app",
    render: () => {
        React.useEffect(() => {
            if (app.layout.tools_bar) {
                app.layout.tools_bar.toggleVisibility(true)
            }
        }, [])

        return <div>
            <h1>Widgets</h1>

            <WidgetsManager />
        </div>
    },
}