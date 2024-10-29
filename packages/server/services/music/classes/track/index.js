export default class Track {
    static create = require("./methods/create").default
    static delete = require("./methods/delete").default
    static get = require("./methods/get").default
    static toggleFavourite = require("./methods/toggleFavourite").default
    static isFavourite = require("./methods/isFavourite").default
}