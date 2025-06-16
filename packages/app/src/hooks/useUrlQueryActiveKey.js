import React from "react"

export default ({
    defaultKey = "0",
    queryKey = "key",
}) => {
    const [activeKey, setActiveKey] = React.useState(new URLSearchParams(window.location.search).get(queryKey) ?? defaultKey)

    const replaceQueryTypeToCurrentTab = (key) => {
        if (!key) {
            // delete query
            return history.pushState(undefined, "", window.location.pathname)
        }

        return history.pushState(undefined, "", `?${queryKey}=${key}`)
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