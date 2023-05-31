import createClient from "comty.js"

export default (params = {}) => {
    return createClient({
        ...params,
        accessKey: process.env.COMTY_ACCESS_KEY,
        privateKey: process.env.COMTY_PRIVATE_KEY,
    })
}