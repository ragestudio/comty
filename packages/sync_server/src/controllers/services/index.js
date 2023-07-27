import path from "path"
import createRoutesFromDirectory from "@utils/createRoutesFromDirectory"

export default async (router) => {
    router = createRoutesFromDirectory("routes", path.resolve(__dirname, "routes"), router)

    return {
        path: "/services",
        router,
    }
}