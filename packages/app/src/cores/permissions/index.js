import Core from "evite/src/core"
import UserModel from "models/user"

export default class PermissionsCore extends Core {
    publicMethods = {
        permissions: this
    }

    isUserAdmin = "unchecked"

    // this will works with a newer version of evite
    async initializeBeforeRuntimeInit() {
        this.isUserAdmin = await UserModel.hasAdmin()
    }

    hasAdmin = async () => {
        return await UserModel.hasAdmin()
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