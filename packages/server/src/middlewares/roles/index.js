export default (req, res, next) => {
    req.isAdmin = () => {
        if (req.user.roles.includes("admin")) {
            return true
        }
        
        return false
    }

    next()
}