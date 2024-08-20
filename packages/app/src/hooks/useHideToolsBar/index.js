import React from "react"

export default (to) => {
    React.useEffect(() => {
        if (typeof to !== "undefined") {
            app.layout.tools_bar.toggleVisibility(to)

            return () => {
                app.layout.tools_bar.toggleVisibility(!!to)
            }
        }

        app.layout.tools_bar.toggleVisibility(false)

        return () => {
            app.layout.tools_bar.toggleVisibility(true)
        }
    }, [])
}