import React from "react"
import lodash from "lodash"

import UserModel from "@models/user"

const pushToServer = lodash.debounce(async (update) => {
    return await UserModel.updateConfig(update)
}, 500)

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

        setLocalData(update)
        pushToServer(update)
    }

    return [
        localData,
        updateConfig,
        firstLoad,
    ]
}