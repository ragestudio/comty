// const fileUpload = require("@nanoexpress/middleware-file-upload/cjs")()

export { default as withAuthentication } from "./withAuthentication"
export { default as errorHandler } from "./errorHandler"
export { default as hasPermissions } from "./hasPermissions"
export { default as roles } from "./roles"
export { default as onlyAdmin } from "./onlyAdmin"
export { default as permissions } from "./permissions"

// export { fileUpload as fileUpload }