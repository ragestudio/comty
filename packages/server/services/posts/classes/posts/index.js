export default class Posts {
    static feed = require("./methods/feed").default
    static data = require("./methods/data").default
    static getLiked = require("./methods/getLiked").default
    static getSaved = require("./methods/getSaved").default
    static fromUserId = require("./methods/fromUserId").default
    static create = require("./methods/create").default
    static fullfillPost = require("./methods/fullfill").default
    static toggleSave = require("./methods/toggleSave").default
    static toggleLike = require("./methods/toggleLike").default
    static report = require("./methods/report").default
    static flag = require("./methods/flag").default
}