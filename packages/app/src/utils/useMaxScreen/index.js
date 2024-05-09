import React from "react"

export default () => {
    const enterPlayerAnimation = () => {
        app.cores.style.applyVariant("dark")
        app.cores.style.compactMode(true)
        app.layout.toggleCenteredContent(false)
        app.controls.toggleUIVisibility(false)
    }

    const exitPlayerAnimation = () => {
        app.cores.style.applyInitialVariant()
        app.cores.style.compactMode(false)
        app.controls.toggleUIVisibility(true)
    }

    React.useEffect(() => {
        enterPlayerAnimation()

        return () => {
            exitPlayerAnimation()
        }
    }, [])
}