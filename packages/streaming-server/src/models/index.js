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

// server
export const Config = mongoose.model("Config", schemas.Config, "config")

// streaming
export const StreamingKeys = mongoose.model("StreamingKeys", schemas.StreamingKey, "StreamingKeys")