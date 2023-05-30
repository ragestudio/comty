import React from "react"

export default ({
    defaultKey = "0",
    queryKey = "key",
}) => {
    const [activeKey, setActiveKey] = React.useState(new URLSearchParams(window.location.search).get(queryKey) ?? defaultKey)

    const replaceQueryTypeToCurrentTab = (key) => {
        if (!key) {
            // delete query
            return app.history.replace(window.location.pathname)
        }

        return app.history.replace(`${window.location.pathname}?${queryKey}=${key}`)
    }

    const changeActiveKey = (key) => {
        setActiveKey(key)
        replaceQueryTypeToCurrentTab(key)
    }

    return [
        activeKey,
        changeActiveKey,
    ]
}