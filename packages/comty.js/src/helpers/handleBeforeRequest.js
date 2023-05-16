export default async (request) => {
    if (__comty_shared_state.onExpiredExceptionEvent) {
        if (__comty_shared_state.excludedExpiredExceptionURL.includes(request.url)) return

        await new Promise((resolve) => {
            __comty_shared_state.eventBus.once("session.regenerated", () => {
                console.log(`Session has been regenerated, retrying request`)

                resolve()
            })
        })
    }
}