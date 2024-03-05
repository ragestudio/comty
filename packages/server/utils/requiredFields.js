// check if exists all required fields inside the obj (can be a object or an array)
// if is something is missing, throw an error
export default (fields, obj) => {
    const missing = []
    const isArray = Array.isArray(obj)

    for (const field of fields) {
        if (isArray) {
            if (!obj.includes(field)) {
                missing.push(field)
            }
        } else {
            if (!obj[field]) {
                missing.push(field)
            }
        }
    }

    if (missing.length > 0) {
        throw new OperationError(400, `Missing required fields: ${missing.join(", ")}`)
    }
}