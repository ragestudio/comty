import requiredFields from "@shared-utils/requiredFields"
import { DateTime } from "luxon"

import { Post } from "@db_models"

export default async (payload = {}) => {
    await requiredFields(["user_id"], payload)

    let { user_id, message, attachments, timestamp, reply_to } = payload

    // check if is a Array and have at least one element
    const isAttachmentsValid = Array.isArray(attachments) && attachments.length > 0

    if (!isAttachmentsValid && !message) {
        throw new OperationError(400, "Cannot create a post without message or attachments")
    }

    if (!timestamp) {
        timestamp = DateTime.local().toISO()
    }

    let post = new Post({
        created_at: timestamp,
        user_id: typeof user_id === "object" ? user_id.toString() : user_id,
        message: message,
        attachments: attachments ?? [],
        reply_to: reply_to,
        flags: [],
    })

    await post.save()

    post = post.toObject()

    // TODO: create background jobs (nsfw dectection)

    // TODO: Push event to Websocket

    return post
}