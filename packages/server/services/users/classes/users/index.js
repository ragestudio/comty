export default class Users {
    static data = require("./method/data").default
    static toggleFollow = require("./method/toggleFollow").default
    static getFollowers = require("./method/getFollowers").default
    static resolveUserId = require("./method/resolveUserId").default
    static update = require("./method/update").default
}