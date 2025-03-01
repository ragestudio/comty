export default class Account {
    static usernameMeetPolicy = require("./methods/usernameMeetPolicy").default
    static passwordMeetPolicy = require("./methods/passwordMeetPolicy").default
    static loginStrategy = require("./methods/loginStrategy").default
    static changePassword = require("./methods/changePassword").default
    static create = require("./methods/create").default
    static sessions = require("./methods/sessions").default
    static deleteSession = require("./methods/deleteSession").default
    static sendActivationCode = require("./methods/sendActivationCode").default
    static activateAccount = require("./methods/activateAccount").default
    static disableAccount = require("./methods/disableAccount").default
}