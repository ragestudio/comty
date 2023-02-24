import Core from "evite/src/core"

import UserModel from "models/user"
import SessionModel from "models/session"

export default class PermissionsCore extends Core {
    static namespace = "permissions"
    static dependencies = ["api"]

    public = {
        hasAdmin: this.hasAdmin,
        checkUserIdIsSelf: this.checkUserIdIsSelf,
        hasPermission: this.hasPermission,
    }

    async hasAdmin() {
        return await UserModel.hasAdmin()
    }

    checkUserIdIsSelf(user_id) {
        return SessionModel.user_id === user_id
    }

    async hasPermission(permission) {
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