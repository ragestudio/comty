import momentTimezone from "moment-timezone"
import requiredFields from "@shared-utils/requiredFields"

import { Post } from "@db_models"

export default async (payload) => {
    if (!payload) {
        throw new Error("Payload is required")
    }

    await requiredFields(["user_id", "timestamp"], payload)

    let { user_id, message, attachments, timestamp, reply_to } = payload

    // check if is a Array and have at least one element
    const isAttachmentsValid = Array.isArray(attachments) && attachments.length > 0

    if (!isAttachmentsValid && !message) {
        throw new Error("Cannot create a post without message or attachments")
    }

    const current_timezone = momentTimezone.tz.guess()
    const created_at = momentTimezone.tz(Date.now(), current_timezone).format()

    let post = new Post({
        created_at: created_at,
        user_id: typeof user_id === "object" ? user_id.toString() : user_id,
        message: message,
        attachments: attachments ?? [],
        timestamp: timestamp,
        reply_to: reply_to,
        flags: [],
    })

    await post.save()

    post = post.toObject()

    // TODO: create background jobs (nsfw dectection)

    // TODO: Push event to Websocket

    return post
}