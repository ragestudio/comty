import request from "./request"

export default async () => {
    const timings = {}

    const promises = [
        new Promise(async (resolve) => {
            const start = Date.now()

            const failTimeout = setTimeout(() => {
                timings.http = "failed"

                resolve()
            }, 10000)

            request({
                method: "GET",
                url: "/ping",
            })
                .then(() => {
                    // set http timing in ms
                    timings.http = Date.now() - start

                    failTimeout && clearTimeout(failTimeout)

                    resolve()
                })
                .catch(() => {
                    timings.http = "failed"

                    resolve()
                })
        }),
        new Promise((resolve) => {
            const start = Date.now()

            const failTimeout = setTimeout(() => {
                timings.ws = "failed"

                resolve()
            }, 10000)

            __comty_shared_state.wsInstances["default"].on("pong", () => {
                timings.ws = Date.now() - start

                failTimeout && clearTimeout(failTimeout)

                resolve()
            })

            __comty_shared_state.wsInstances["default"].emit("ping")
        })
    ]

    await Promise.all(promises)

    return timings
}