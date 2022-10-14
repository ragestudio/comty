import Core from "evite/src/core"

import UserModel from "models/user"
import SessionModel from "models/session"

export default class PermissionsCore extends Core {
    static namespace = "permissions"
    static dependencies = ["api"]
    static public = ["hasAdmin", "checkUserIdIsSelf", "hasPermission"]

    userData = null
    isUserAdmin = null

    hasAdmin = async () => {
        return await UserModel.hasAdmin()
    }

    checkUserIdIsSelf = (userId) => {
        return SessionModel.user_id === userId
    }

    hasPermission = async (permission) => {
        let query = []

        if (Array.isArray(permission)) {
            query = permission
        } else {
            query = [permission]
        }

        // create a promise and check if the user has all the permission in the query
        const result = await Promise.all(query.map(async (permission) => {
            const hasPermission = await UserModel.hasRole(permission)

            return hasPermission
        }))

        // if the user has all the permission in the query, return true
        if (result.every((hasPermission) => hasPermission)) {
            return true
        }

        return false
    }
}