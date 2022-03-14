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

export const Config = mongoose.model("Config", schemas.Config, "config")
export const User = mongoose.model("User", schemas.User, "accounts")
export const Session = mongoose.model("Session", schemas.Session, "sessions")
export const Role = mongoose.model("Role", schemas.Role, "roles")
export const Post = mongoose.model("Post", schemas.Post, "posts")
export const Comment = mongoose.model("Comment", schemas.Comment, "comments")
//export const Tag = mongoose.model("Tag", schemas.Tag, "tags")