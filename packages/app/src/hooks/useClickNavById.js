import React from "react"

const useClickNavById = (navigators = {}, itemFlagId = "div") => {
    const ref = React.useRef(null)

    async function onClick(e) {
        const element = e.target.closest(itemFlagId ?? "div")

        if (!element) {
            console.error("Element not found")
            return false
        }

        const id = element?.id

        if (!id) {
            console.error("Element id not found")
            return false
        }

        const location = navigators[id]

        if (!location) {
            console.error("Location not found")
            return false
        }

        app.location.push(location)
    }

    return [
        ref,
        {
            onClick
        }
    ]
}

export default useClickNavById