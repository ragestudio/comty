import React from "react"
import classnames from "classnames"

export default () => {
    const [activeColor, setActiveColor] = React.useState(false)

    const hasBackgroundSVG = (value) => {
        if (value === "unset" || value === "none" || !value) {
            return false
        } else {
            return true
        }
    }

    const handleStyleUpdate = (update) => {
        if (hasBackgroundSVG(update["backgroundSVG"])) {
            setActiveColor(true)
        } else {
            setActiveColor(false)
        }
    }

    React.useEffect(() => {
        app.eventBus.on("style.update", handleStyleUpdate)

        const activeSVG = app.cores.style.getValue("backgroundSVG")

        if (hasBackgroundSVG(activeSVG)) {
            setActiveColor(true)
        }

        return () => {
            app.eventBus.off("style.update", handleStyleUpdate)
        }
    }, [])

    return <div
        id="root_background"
        className={
            classnames(
                "root_background",
                {
                    ["active"]: activeColor
                }
            )
        }
    />
}