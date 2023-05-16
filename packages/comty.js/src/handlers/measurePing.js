import request from "./request"

export default async () => {
    const timings = {}

    const promises = [
        new Promise(async (resolve) => {
            const start = Date.now()

            request({
                method: "GET",
                url: "/ping",
            })
                .then(() => {
                    // set http timing in ms
                    timings.http = Date.now() - start

                    resolve()
                })
                .catch(() => {
                    timings.http = "failed"
                    resolve()
                })

            setTimeout(() => {
                timings.http = "failed"

                resolve()
            }, 10000)
        }),
        new Promise((resolve) => {
            const start = Date.now()

            __comty_shared_state.wsInstances["default"].on("pong", () => {
                timings.ws = Date.now() - start

                resolve()
            })

            __comty_shared_state.wsInstances["default"].emit("ping")

            setTimeout(() => {
                timings.ws = "failed"

                resolve()
            }, 10000)
        })
    ]

    await Promise.all(promises)

    return timings
}