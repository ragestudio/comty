import React from "react"

export default () => {
    const enterPlayerAnimation = () => {
        app.cores.style.applyTemporalVariant("dark")
        app.layout.toggleCompactMode(true)
        app.layout.toggleCenteredContent(false)
        app.controls.toggleUIVisibility(false)
    }

    const exitPlayerAnimation = () => {
        app.cores.style.applyVariant(app.cores.style.getStoragedVariantKey())
        app.layout.toggleCompactMode(false)
        app.layout.toggleCenteredContent(true)
        app.controls.toggleUIVisibility(true)
    }

    React.useEffect(() => {
        enterPlayerAnimation()

        return () => {
            exitPlayerAnimation()
        }
    }, [])
}