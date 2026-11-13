import dataMethod from "./method/data"
import toggleFollowMethod from "./method/toggleFollow"
import getFollowersMethod from "./method/getFollowers"
import resolveUserIdMethod from "./method/resolveUserId"
import updateMethod from "./method/update"

export default class Users {
	static data = dataMethod
	static toggleFollow = toggleFollowMethod
	static getFollowers = getFollowersMethod
	static resolveUserId = resolveUserIdMethod
	static update = updateMethod
}
