import React from "react"

export default () => {
    React.useEffect(() => {
        app.layout.toogleCenteredContent(true)

        return () => {
            app.layout.toogleCenteredContent(false)
        }
    }, [])
}