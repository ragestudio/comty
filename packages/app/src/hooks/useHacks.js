import React from "react"

export default (hacks, options = {}) => {
    if (typeof options.namespace === "undefined") {
        // if no namespace is provided, use the name of the calling function
        const stack = new Error().stack
        const caller = stack.split("\n")[2].trim()
        const match = caller.match(/at ([^(]+) \(/)
        if (match) {
            options.namespace = match[1]
        }
    }

    if (!options.namespace) {
        throw new Error("No namespace provided for hacks")
    }

    React.useEffect(() => {
        if (!window._hacks) {
            window._hacks = {}
        }

        window._hacks[options.namespace] = hacks

        return () => {
            delete window._hacks[options.namespace]
        }
    }, [])
}