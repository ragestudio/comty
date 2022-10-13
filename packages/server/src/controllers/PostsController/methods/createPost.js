import { Post } from "../../../models"
import getPostData from "./getPostData"
import momentTimezone from "moment-timezone"

export default async (payload) => {
    let { user_id, message, attachments, type, data, timestamp } = payload

    // check if is a Array and have at least one element
    const isAttachmentsValid = Array.isArray(attachments) && attachments.length > 0

    if (!isAttachmentsValid && !message) {
        throw new Error("Cannot create a post without message or attachments")
    }

    if (message) {
        message = String(message).toString()
    }

    const current_timezone = momentTimezone.tz.guess()
    const created_at = momentTimezone.tz(Date.now(), current_timezone).format()

    const post = new Post({
        type: type,
        created_at: created_at,
        user_id: typeof user_id === "object" ? user_id.toString() : user_id,
        message: message,
        attachments: attachments ?? [],
        timestamp: timestamp,
        data: data,
    })

    await post.save()

    const resultPost = await getPostData({ post_id: post._id.toString() })

    global.wsInterface.io.emit(`post.new`, resultPost)
    global.wsInterface.io.emit(`post.new.${post.user_id}`, resultPost)

    return post
}