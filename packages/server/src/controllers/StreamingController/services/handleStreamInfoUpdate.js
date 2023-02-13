import { StreamingInfo } from "@models"

import lodash from "lodash"

export default async (payload) => {
    let info = await StreamingInfo.findOne({
        user_id: payload.user_id
    }).catch((err) => {
        return false
    })

    const payloadValues = {
        title: payload.title,
        description: payload.description,
        category: payload.category,
        thumbnail: payload.thumbnail,
    }

    if (!info) {
        // create new info
        info = new StreamingInfo({
            user_id: payload.user_id,
            ...payloadValues
        })
    }

    // merge data
    info = lodash.merge(info, {
        title: payload.title,
        description: payload.description,
        category: payload.category,
        thumbnail: payload.thumbnail,
    })

    await info.save()

    global.websocket_instance.io.emit(`streaming.info_update.${payload.user_id}`, info)

    return info
}