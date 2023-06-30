import React from "react"

export default () => {
    React.useEffect(() => {
        app.layout.toggleCenteredContent(true)

        return () => {
            app.layout.toggleCenteredContent(false)
        }
    }, [])
}