import React from "react"

export default (
    wsEvents,
    {
        socketName
    } = {}
) => {
    function registerEvents() {
        for (const [eventName, eventHandler] of Object.entries(wsEvents)) {
            app.cores.api.listenEvent(eventName, eventHandler, socketName)
        }
    }

    function unregisterEvents() {
        for (const [eventName, eventHandler] of Object.entries(wsEvents)) {
            app.cores.api.unlistenEvent(eventName, eventHandler, socketName)
        }
    }

    React.useEffect(() => {
        if (typeof wsEvents === "function") {
            wsEvents = [wsEvents]
        }

        registerEvents()

        return () => {
            unregisterEvents()
        }
    }, [])

    return wsEvents
}