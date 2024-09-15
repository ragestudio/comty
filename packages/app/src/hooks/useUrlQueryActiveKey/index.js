import React from "react"

export default ({
    defaultKey = "0",
    queryKey = "key",
}) => {
    const [activeKey, setActiveKey] = React.useState(new URLSearchParams(window.location.hash.replace("#", "?")).get(queryKey) ?? defaultKey)

    const replaceQueryTypeToCurrentTab = (key) => {
        if (!key) {
            // delete query
            return document.location.hash = null
        }

        return document.location.hash = `${queryKey}=${key}`
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