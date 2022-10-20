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

// sessions
export const Session = mongoose.model("Session", schemas.Session, "sessions")
export const RegenerationToken = mongoose.model("RegenerationToken", schemas.RegenerationToken, "regenerationTokens")

// users
export const User = mongoose.model("User", schemas.User, "accounts")
export const UserFollow = mongoose.model("UserFollow", schemas.UserFollow, "follows")
export const Role = mongoose.model("Role", schemas.Role, "roles")
export const Badge = mongoose.model("Badge", schemas.Badge, "badges")

// posts
export const Post = mongoose.model("Post", schemas.Post, "posts")
export const Comment = mongoose.model("Comment", schemas.Comment, "comments")
export const SavedPost = mongoose.model("SavedPost", schemas.SavedPost, "savedPosts")

// streamings
export const StreamingKey = mongoose.model("StreamingKey", schemas.streamingKey, "streamingKeys")

// others
export const FeaturedWallpaper = mongoose.model("FeaturedWallpaper", schemas.FeaturedWallpaper, "featuredWallpapers")
export const FeaturedEvent = mongoose.model("FeaturedEvent", schemas.FeaturedEvent, "featuredEvents")