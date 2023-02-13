import { default as dbAdmin } from "./dbAdmin"
import { default as authorizeSelfServerToken } from "./authorizeSelfServerToken"

// set here the setup functions
export default [
    dbAdmin,
    authorizeSelfServerToken,
]