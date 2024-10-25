import React from "react"

const usePageWidgets = (widgets = []) => {
    React.useEffect(() => {
        for (const widget of widgets) {
            app.layout.tools_bar.attachRender(widget.id, widget.component, widget.props)
        }

        return () => {
            for (const widget of widgets) {
                app.layout.tools_bar.detachRender(widget.id)
            }
        }
    })
}

export default usePageWidgets