import { User } from "models"

export function hasPermissions() {

}

export async function hasAdmin() {
    const roles = await User.roles

    if (!roles) {
        return false
    }

    return Array.isArray(roles) && roles.includes("admin")
}