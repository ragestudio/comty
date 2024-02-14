import path from "path"
import createRoutesFromDirectory from "@utils/createRoutesFromDirectory"
import getMiddlewares from "@utils/getMiddlewares"

export default async (router) => {
    // create a file based router
    const routesPath = path.resolve(__dirname, "routes")

    const middlewares = await getMiddlewares(["withOptionalAuth"])

    for (const middleware of middlewares) {
        router.use(middleware)
    }

    router = createRoutesFromDirectory("routes", routesPath, router)

    return {
        path: "/lyrics",
        router,
    }
}