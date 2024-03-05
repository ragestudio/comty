import handleBeforeRequest from "../helpers/handleBeforeRequest"
import handleAfterRequest from "../helpers/handleAfterRequest"

export default async (
    request = {
        method: "GET",
    },
    ...args
) => {
    const instance = request.instance ?? __comty_shared_state.instances.default

    if (!instance) {
        throw new Error("No instance provided")
    }

    // handle before request
    await handleBeforeRequest(request)

    if (typeof request === "string") {
        request = {
            url: request,
        }
    }

    if (typeof request.headers !== "object") {
        request.headers = {}
    }

    let result = null

    const makeRequest = async () => {
        const _result = await instance(request, ...args)
            .catch((error) => {
                return error
            })

        result = _result
    }

    await makeRequest()

    // handle after request
    await handleAfterRequest(result, makeRequest)

    // if error, throw it
    if (result instanceof Error) {
        throw result
    }

    return result
}