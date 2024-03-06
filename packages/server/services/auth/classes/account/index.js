export default class Account {
    static usernameMeetPolicy = require("./methods/usernameMeetPolicy").default
    static passwordMeetPolicy = require("./methods/passwordMeetPolicy").default
    static loginStrategy = require("./methods/loginStrategy").default
    static changePassword = require("./methods/changePassword").default
    static create = require("./methods/create").default
}