import path from "path"
import createRoutesFromDirectory from "@utils/createRoutesFromDirectory"

export default (router) => {
    // create a file based router
    const routesPath = path.resolve(__dirname, "routes")

   // router = createRoutesFromDirectory("routes", routesPath, router)

    return {
        path: "/playlists",
        router,
    }
}