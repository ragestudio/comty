export default class Posts {
    static create = require("./methods/create").default

    static data = require("./methods/data").default

    static fullfillPost = require("./methods/fullfill").default
}