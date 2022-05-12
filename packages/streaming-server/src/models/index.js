import mongoose, { Schema } from "mongoose"

function getSchemas() {
    const obj = Object()

    const _schemas = require("../schemas")

    Object.keys(_schemas).forEach((key) => {
        obj[key] = Schema(_schemas[key])
    })

    return obj
}

const schemas = getSchemas()

// streaming
export const StreamingKey = mongoose.model("StreamingKey", schemas.streamingKey, "streamingKeys")