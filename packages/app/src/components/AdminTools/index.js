import UserDataManager from "./UserDataManager"
import UserRolesManager from "./UserRolesManager"

export { UserDataManager, UserRolesManager }

export const open = {
    dataManager: (user) => {
        return new Promise((resolve, reject) => {
            window.app.DrawerController.open("UserDataManager", UserDataManager, {
                componentProps: {
                    user: user,
                },
                onDone: (ctx, value) => {
                    resolve(value)
                    ctx.close()
                },
                onFail: (ctx, value) => {
                    reject(value)
                    ctx.close()
                }
            })
        })
    },
    rolesManager: (id) => {
        return new Promise((resolve, reject) => {
            window.app.DrawerController.open("UserRolesManager", UserRolesManager, {
                componentProps: {
                    id: id,
                },
                onDone: (ctx, value) => {
                    resolve(value)
                    ctx.close()
                },
                onFail: (ctx, value) => {
                    reject(value)
                    ctx.close()
                }
            })
        })
    }
}