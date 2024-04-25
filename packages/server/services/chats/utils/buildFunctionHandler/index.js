export default (fn, socket) => {
    return async (...args) => {
        if (typeof socket === "undefined") {
            socket = arguments[0]
        }

        try {
            fn(socket, ...args)
        } catch (error) {
            console.error(`[HANDLER_ERROR] ${error.message} >`, error.stack)

            if (typeof socket.emit !== "function") {
                return false
            }

            return socket.emit("error", {
                message: error.message,
            })
        }
    }
}