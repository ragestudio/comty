import dataMethod from "./method/data.js"
import toggleFollowMethod from "./method/toggleFollow.js"
import getFollowersMethod from "./method/getFollowers.js"
import resolveUserIdMethod from "./method/resolveUserId.js"
import updateMethod from "./method/update.js"

export default class Users {
    static data = dataMethod
    static toggleFollow = toggleFollowMethod
    static getFollowers = getFollowersMethod
    static resolveUserId = resolveUserIdMethod
    static update = updateMethod
}