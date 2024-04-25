import React from "react"

import UserModel from "@models/user"

export default (props = {}) => {
    const [firstLoad, setFirstLoad] = React.useState(true)
    const [localData, setLocalData] = React.useState({})

    React.useEffect(() => {
        UserModel.getConfig().then((config) => {
            setLocalData(config)
            setFirstLoad(false)
        })
    }, [])

    async function updateConfig(update) {
        if (typeof props.onUpdate === "function") {
            props.onUpdate(localData)
        }

        const config = await UserModel.updateConfig(update)
        setLocalData(config)
    }

    return [
        localData,
        updateConfig,
        firstLoad,
    ]
}