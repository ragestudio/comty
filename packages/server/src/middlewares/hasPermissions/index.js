export const hasPermissions = (req, res, next) => {
    if (typeof (req.userData) == "undefined") {
        return res.status(403).json(`User data is not available, please ensure if you are authenticated`)
    }
    
    const { _id, username, roles } = req.userData
    const { permissions } = req.body

    req.userPermissions = roles

    let check = []

    if (Array.isArray(permissions)) {
        check = permissions
    } else {
        check.push(permissions)
    }

    if (check.length > 0) {
        check.forEach((role) => {
            if (!roles.includes(role)) {
                return res.status(403).json(`${username} not have permissions ${permissions}`)
            }
        })
    }

    next()
}

export default hasPermissions
